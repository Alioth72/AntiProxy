import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/class_model.dart';
import '../../models/attendance_model.dart';
import '../../models/recognition_result_model.dart';
import '../../services/api_service.dart';
import '../../services/http_data_service.dart';
import 'swipe_attendance_page.dart';
import 'attendance_orchestration_page.dart';

/// Tracks the state of each selected image through the recognition pipeline.
enum ImageStatus { pending, processing, completed, failed }

/// Holds a selected image file along with its processing state and results.
class _ImageEntry {
  final File file;
  ImageStatus status;
  String? processedImagePath;
  List<RecognitionResultModel> results;
  Set<String> matchedRollNumbers; // roll numbers matched from THIS image only
  String? errorMessage;

  _ImageEntry(this.file)
      : status = ImageStatus.pending,
        results = [],
        matchedRollNumbers = {};
}

class FaceRecognitionAttendancePage extends StatefulWidget {
  final ClassModel classModel;
  final DateTime selectedDate;

  const FaceRecognitionAttendancePage({
    super.key,
    required this.classModel,
    required this.selectedDate,
  });

  @override
  State<FaceRecognitionAttendancePage> createState() =>
      _FaceRecognitionAttendancePageState();
}

class _FaceRecognitionAttendancePageState
    extends State<FaceRecognitionAttendancePage> {
  final ApiService _apiService = ApiService();
  final ImagePicker _picker = ImagePicker();

  // --- Multi-image state ---
  final List<_ImageEntry> _images = [];
  bool _isProcessing = false;
  int _currentProcessingIndex = -1;
  Map<String, String> _studentStatuses = {};
  late DateTime _selectedDate;

  // Union of ALL matched roll numbers across all images (recalculated on removal)
  Set<String> _unionRollNumbers = {};

  // Best recognition result per roll number (highest similarity)
  Map<String, RecognitionResultModel> _bestResults = {};

  // Similarity threshold for face recognition (20%)
  static const double _similarityThreshold = 0.20;

  // Whether processing has been run at least once
  bool get _hasProcessed => _images.any((e) => e.status == ImageStatus.completed);
  bool get _allProcessed =>
      _images.isNotEmpty && _images.every((e) => e.status != ImageStatus.pending);

  @override
  void initState() {
    super.initState();
    _initializeStudentStatuses();
    _selectedDate = widget.selectedDate;
  }

  // ─────────────────────────────────────────────────────────────────
  // Student status helpers
  // ─────────────────────────────────────────────────────────────────

  void _initializeStudentStatuses() {
    for (var student in widget.classModel.students) {
      _studentStatuses[student.rno] = 'absent';
    }
  }

  void _rebuildUnionAndStatuses() {
    // Recalculate union from scratch using only completed images
    _unionRollNumbers.clear();
    _bestResults.clear();
    for (var entry in _images) {
      if (entry.status == ImageStatus.completed) {
        _unionRollNumbers.addAll(entry.matchedRollNumbers);
        for (var result in entry.results) {
          if (result.similarityScore >= _similarityThreshold) {
            final rollNo = result.personId ?? '';
            if (rollNo.isEmpty) continue;
            final existing = _bestResults[rollNo];
            if (existing == null ||
                result.similarityScore > existing.similarityScore) {
              _bestResults[rollNo] = result;
            }
          }
        }
      }
    }
    // Update student statuses from union
    _initializeStudentStatuses();
    for (var rollNo in _unionRollNumbers) {
      _studentStatuses[rollNo] = 'present';
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Image picking
  // ─────────────────────────────────────────────────────────────────

  Future<void> _pickImages() async {
    try {
      final dynamic result = await showModalBottomSheet(
        context: context,
        builder: (BuildContext context) {
          return SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.camera_alt),
                  title: const Text('Take Photo'),
                  onTap: () => Navigator.pop(context, 'camera'),
                ),
                ListTile(
                  leading: const Icon(Icons.photo_library),
                  title: const Text('Choose from Gallery (multi-select)'),
                  onTap: () => Navigator.pop(context, 'gallery'),
                ),
                ListTile(
                  leading: const Icon(Icons.cancel),
                  title: const Text('Cancel'),
                  onTap: () => Navigator.pop(context),
                ),
              ],
            ),
          );
        },
      );

      if (result == null) return;

      if (result == 'camera') {
        final XFile? image = await _picker.pickImage(
          source: ImageSource.camera,
          maxWidth: 1920,
          maxHeight: 1080,
          imageQuality: 85,
        );
        if (image != null) {
          setState(() => _images.add(_ImageEntry(File(image.path))));
        }
      } else {
        // Gallery – allow multi-select
        final List<XFile> picked = await _picker.pickMultiImage(
          maxWidth: 1920,
          maxHeight: 1080,
          imageQuality: 85,
        );
        if (picked.isNotEmpty) {
          setState(() {
            for (var xf in picked) {
              _images.add(_ImageEntry(File(xf.path)));
            }
          });
        }
      }
    } catch (e) {
      _showErrorDialog('Error picking image: $e');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Remove image
  // ─────────────────────────────────────────────────────────────────

  void _removeImage(int index) {
    setState(() {
      _images.removeAt(index);
      _rebuildUnionAndStatuses();
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Process all pending images sequentially
  // ─────────────────────────────────────────────────────────────────

  Future<void> _processAllImages() async {
    if (_images.isEmpty) return;

    setState(() => _isProcessing = true);

    final List<String> allowedRollNumbers =
        widget.classModel.students.map((s) => s.rno).toList();

    for (int i = 0; i < _images.length; i++) {
      final entry = _images[i];
      if (entry.status != ImageStatus.pending) continue; // skip already done

      setState(() {
        _currentProcessingIndex = i;
        entry.status = ImageStatus.processing;
      });

      try {
        final apiResult = await _apiService.processImageForAttendance(
          entry.file,
          allowedRollNumbers: allowedRollNumbers,
        );

        entry.processedImagePath = apiResult.$1;
        entry.results = apiResult.$2;
        entry.matchedRollNumbers = _matchResultsToRoster(apiResult.$2);
        entry.status = ImageStatus.completed;

        // Merge into union
        _unionRollNumbers.addAll(entry.matchedRollNumbers);
        for (var result in entry.results) {
          if (result.similarityScore >= _similarityThreshold) {
            final rollNo = result.personId ?? '';
            if (rollNo.isEmpty) continue;
            final existing = _bestResults[rollNo];
            if (existing == null ||
                result.similarityScore > existing.similarityScore) {
              _bestResults[rollNo] = result;
            }
          }
        }

        // Update student statuses live
        for (var rollNo in entry.matchedRollNumbers) {
          _studentStatuses[rollNo] = 'present';
        }

        setState(() {}); // refresh UI after each image
      } catch (e) {
        entry.status = ImageStatus.failed;
        entry.errorMessage = e.toString();
        setState(() {});
        debugPrint('Image $i failed: $e');
        // Continue with remaining images
      }
    }

    setState(() {
      _isProcessing = false;
      _currentProcessingIndex = -1;
    });

    // Snackbar summary
    if (mounted) {
      final presentCount =
          _studentStatuses.values.where((s) => s == 'present').length;
      final completedCount =
          _images.where((e) => e.status == ImageStatus.completed).length;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              '$presentCount students marked present from $completedCount images'),
          backgroundColor: presentCount > 0 ? Colors.green : Colors.orange,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  /// Match recognition results to class roster and return matched roll numbers.
  Set<String> _matchResultsToRoster(List<RecognitionResultModel> results) {
    Set<String> matched = {};

    for (var result in results) {
      if (result.similarityScore < _similarityThreshold) continue;

      // PRIMARY: personId (roll number) matching
      if (result.personId != null && result.personId!.isNotEmpty) {
        final inRoster = widget.classModel.students.any(
          (s) => s.rno == result.personId,
        );
        if (inRoster && !matched.contains(result.personId!)) {
          matched.add(result.personId!);
          debugPrint(
              '✓ MATCHED: ${result.personId} (${(result.similarityScore * 100).toStringAsFixed(1)}%)');
        }
        continue;
      }

      // FALLBACK: name-based matching
      final recognizedName = result.name.toLowerCase().trim();
      final normalizedRecognizedName = recognizedName
          .replaceAll(RegExp(r'[^\w\s]'), '')
          .replaceAll(RegExp(r'\s+'), ' ');

      for (var student in widget.classModel.students) {
        if (matched.contains(student.rno)) continue;
        final studentName = student.name.toLowerCase().trim();
        final normalizedStudentName = studentName
            .replaceAll(RegExp(r'[^\w\s]'), '')
            .replaceAll(RegExp(r'\s+'), ' ');

        if (studentName == recognizedName ||
            normalizedStudentName == normalizedRecognizedName ||
            (!recognizedName.contains(' ') &&
                student.name.split(' ').first.toLowerCase().trim() ==
                    recognizedName)) {
          matched.add(student.rno);
          debugPrint(
              '✓ NAME MATCHED: "${result.name}" -> ${student.name} (${student.rno})');
          break;
        }
      }
    }
    return matched;
  }

  // ─────────────────────────────────────────────────────────────────
  // UI helpers
  // ─────────────────────────────────────────────────────────────────

  void _toggleStudentStatus(String rollNo) {
    setState(() {
      final current = _studentStatuses[rollNo] ?? 'absent';
      _studentStatuses[rollNo] = current == 'present' ? 'absent' : 'present';
    });
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Error'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showImageInFullScreen(BuildContext context, String imagePath) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.black,
            foregroundColor: Colors.white,
            title: const Text('Recognized Image'),
          ),
          body: InteractiveViewer(
            panEnabled: true,
            boundaryMargin: EdgeInsets.zero,
            minScale: 0.1,
            maxScale: 10.0,
            child: Center(
              child: Image.file(
                File(imagePath),
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline,
                            size: 64, color: Colors.white),
                        SizedBox(height: 16),
                        Text('Image not found',
                            style: TextStyle(color: Colors.white)),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Detailed results view
  // ─────────────────────────────────────────────────────────────────

  void _showDetailedResults() {
    final completedEntries =
        _images.where((e) => e.status == ImageStatus.completed).toList();

    // Gather all results across images, deduplicated by roll number (best score)
    final Map<String, _DetailedResult> allResults = {};
    for (int imgIdx = 0; imgIdx < completedEntries.length; imgIdx++) {
      final entry = completedEntries[imgIdx];
      for (var r in entry.results) {
        if (r.similarityScore < _similarityThreshold) continue;
        final key = r.personId ?? r.name;
        final existing = allResults[key];
        if (existing == null ||
            r.similarityScore > existing.result.similarityScore) {
          allResults[key] = _DetailedResult(
            result: r,
            imageIndex: imgIdx,
          );
        }
        // Track all images this person appeared in
        allResults[key]!.imageIndices.add(imgIdx);
      }
    }

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (ctx) => Scaffold(
          backgroundColor: Theme.of(context).scaffoldBackgroundColor,
          appBar: AppBar(
            backgroundColor: Theme.of(context).colorScheme.primary,
            foregroundColor: Theme.of(context).colorScheme.onPrimary,
            title: const Text('Face API Results'),
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // ── Processed Images with bounding boxes ──
              Text(
                'Processed Images (${completedEntries.length})',
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              ...List.generate(completedEntries.length, (i) {
                final entry = completedEntries[i];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Image ${i + 1} — ${entry.matchedRollNumbers.length} students found',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 4),
                      GestureDetector(
                        onTap: () => _showImageInFullScreen(
                            ctx, entry.processedImagePath!),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.file(
                            File(entry.processedImagePath!),
                            width: double.infinity,
                            fit: BoxFit.fitWidth,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),

              const Divider(height: 32),

              // ── All recognized students ──
              Text(
                'Recognized Students (${allResults.length})',
                style: const TextStyle(
                    fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              if (allResults.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No students recognized above threshold.'),
                )
              else
                ...allResults.entries.map((e) {
                  final detail = e.value;
                  final r = detail.result;
                  final pct =
                      (r.similarityScore * 100).toStringAsFixed(1);
                  final imgList = detail.imageIndices
                      .toList()
                      .map((idx) => 'Img ${idx + 1}')
                      .join(', ');
                  // Try to find student name from roster
                  String displayName = r.name;
                  if (r.personId != null) {
                    try {
                      final student = widget.classModel.students
                          .firstWhere((s) => s.rno == r.personId);
                      displayName = student.name;
                    } catch (_) {}
                  }

                  return Card(
                    margin: const EdgeInsets.only(bottom: 6),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Colors.green,
                        child: Text(
                          displayName.isNotEmpty
                              ? displayName[0].toUpperCase()
                              : '?',
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold),
                        ),
                      ),
                      title: Text(displayName),
                      subtitle: Text(
                        'Roll: ${r.personId ?? 'N/A'} • $pct% match • $imgList',
                        style: const TextStyle(fontSize: 12),
                      ),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.green.shade100,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '$pct%',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: Colors.green.shade800,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // Save attendance
  // ─────────────────────────────────────────────────────────────────

  Future<void> _proceedToConfirmation() async {
    if (!_hasProcessed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please process images before saving attendance'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2196F3)),
        ),
      ),
    );

    try {
      // Use the first completed processed image path for the record
      final firstCompleted =
          _images.where((e) => e.status == ImageStatus.completed).firstOrNull;

      final attendanceRecord = AttendanceModel(
        id: '',
        classId: widget.classModel.docId!,
        date: _selectedDate.toIso8601String().split('T')[0],
        studentStatuses: Map<String, String>.from(_studentStatuses),
        processedImagePath: firstCompleted?.processedImagePath,
      );

      await context
          .read<HttpDataService>()
          .saveAttendanceRecord(attendanceRecord);

      if (mounted) Navigator.pop(context); // close loading

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 8),
                Text('Attendance saved successfully!'),
              ],
            ),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 2),
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving attendance: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // BUILD
  // ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final presentCount =
        _studentStatuses.values.where((s) => s == 'present').length;
    final completedCount =
        _images.where((e) => e.status == ImageStatus.completed).length;
    final pendingCount =
        _images.where((e) => e.status == ImageStatus.pending).length;
    final processedTotal = _images.length - pendingCount;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Theme.of(context).colorScheme.onPrimary,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Face Recognition Attendance',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            Text(
              '${widget.classModel.name} | Code: ${widget.classModel.id} | Section: ${widget.classModel.section}',
              style:
                  const TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // ── IMAGE GRID SECTION ──
          Expanded(
            flex: 2,
            child: Container(
              margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  // Progress header (shown during / after processing)
                  if (_isProcessing || _hasProcessed)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color:
                            Theme.of(context).colorScheme.primaryContainer,
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(12),
                          topRight: Radius.circular(12),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                _isProcessing
                                    ? Icons.hourglass_top
                                    : Icons.check_circle,
                                size: 18,
                                color: _isProcessing
                                    ? Colors.orange
                                    : Colors.green,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _isProcessing
                                      ? 'Processing ${_currentProcessingIndex + 1} of ${_images.length} images...'
                                      : '$presentCount students present (from $completedCount images)',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                  ),
                                ),
                              ),
                              if (_hasProcessed && !_isProcessing)
                                GestureDetector(
                                  onTap: _showDetailedResults,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.9),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.visibility,
                                            size: 14,
                                            color: Theme.of(context)
                                                .colorScheme
                                                .primary),
                                        const SizedBox(width: 4),
                                        Text(
                                          'Details',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: Theme.of(context)
                                                .colorScheme
                                                .primary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: _images.isEmpty
                                  ? 0
                                  : processedTotal / _images.length,
                              minHeight: 6,
                              backgroundColor: Colors.grey.shade300,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                _isProcessing
                                    ? Colors.orange
                                    : Colors.green,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Image grid or empty placeholder
                  Expanded(
                    child: _images.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.add_photo_alternate_outlined,
                                    size: 64, color: Colors.grey.shade400),
                                const SizedBox(height: 16),
                                Text(
                                  'No images selected',
                                  style: TextStyle(
                                      fontSize: 18,
                                      color: Colors.grey.shade600),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Add photos to start face recognition',
                                  style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey.shade500),
                                ),
                              ],
                            ),
                          )
                        : GridView.builder(
                            padding: const EdgeInsets.all(8),
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 8,
                              mainAxisSpacing: 8,
                            ),
                            itemCount: _images.length,
                            itemBuilder: (context, index) {
                              final entry = _images[index];
                              final isCurrentlyProcessing =
                                  _isProcessing &&
                                      index == _currentProcessingIndex;

                              return Stack(
                                children: [
                                  // Image
                                  GestureDetector(
                                    onTap: entry.processedImagePath != null
                                        ? () => _showImageInFullScreen(
                                            context,
                                            entry.processedImagePath!)
                                        : null,
                                    child: ClipRRect(
                                      borderRadius:
                                          BorderRadius.circular(8),
                                      child: Container(
                                        decoration: BoxDecoration(
                                          border: Border.all(
                                            color: isCurrentlyProcessing
                                                ? Colors.orange
                                                : entry.status ==
                                                        ImageStatus.completed
                                                    ? Colors.green
                                                    : entry.status ==
                                                            ImageStatus.failed
                                                        ? Colors.red
                                                        : Colors
                                                            .grey.shade300,
                                            width: isCurrentlyProcessing
                                                ? 3
                                                : 2,
                                          ),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        child: ClipRRect(
                                          borderRadius:
                                              BorderRadius.circular(6),
                                          child: Image.file(
                                            entry.file,
                                            width: double.infinity,
                                            height: double.infinity,
                                            fit: BoxFit.cover,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),

                                  // Status badge (bottom-left)
                                  if (entry.status !=
                                      ImageStatus.pending)
                                    Positioned(
                                      bottom: 4,
                                      left: 4,
                                      child: Container(
                                        padding:
                                            const EdgeInsets.symmetric(
                                                horizontal: 6,
                                                vertical: 2),
                                        decoration: BoxDecoration(
                                          color: entry.status ==
                                                  ImageStatus.completed
                                              ? Colors.green
                                              : entry.status ==
                                                      ImageStatus
                                                          .processing
                                                  ? Colors.orange
                                                  : Colors.red,
                                          borderRadius:
                                              BorderRadius.circular(10),
                                        ),
                                        child: Text(
                                          entry.status ==
                                                  ImageStatus.completed
                                              ? '${entry.matchedRollNumbers.length} found'
                                              : entry.status ==
                                                      ImageStatus
                                                          .processing
                                                  ? '...'
                                                  : 'Error',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ),

                                  // Remove button (top-right)
                                  if (!_isProcessing)
                                    Positioned(
                                      top: 2,
                                      right: 2,
                                      child: GestureDetector(
                                        onTap: () => _removeImage(index),
                                        child: Container(
                                          padding:
                                              const EdgeInsets.all(4),
                                          decoration: BoxDecoration(
                                            color: Colors.black
                                                .withOpacity(0.6),
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(
                                            Icons.close,
                                            color: Colors.white,
                                            size: 16,
                                          ),
                                        ),
                                      ),
                                    ),

                                  // Processing spinner overlay
                                  if (isCurrentlyProcessing)
                                    Positioned.fill(
                                      child: Container(
                                        decoration: BoxDecoration(
                                          color: Colors.black
                                              .withOpacity(0.4),
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        child: const Center(
                                          child:
                                              CircularProgressIndicator(
                                            strokeWidth: 3,
                                            valueColor:
                                                AlwaysStoppedAnimation<
                                                    Color>(
                                              Colors.white,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
          ),

          // ── STUDENT LIST SECTION ──
          Expanded(
            flex: 3,
            child: Container(
              margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.primaryContainer,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(12),
                        topRight: Radius.circular(12),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.people),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Student List (${widget.classModel.students.length})',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                  if (_hasProcessed)
                                    Text(
                                      '$presentCount present • ${_images.length} images',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey[700],
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.calendar_month, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              'Date: ${_selectedDate.toIso8601String().split('T')[0]}',
                              style: const TextStyle(color: Colors.white),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: ListView.builder(
                      itemCount: widget.classModel.students.length,
                      itemBuilder: (context, index) {
                        final student =
                            widget.classModel.students[index];
                        final status =
                            _studentStatuses[student.rno] ?? 'absent';
                        final isPresent = status == 'present';

                        // Look up best result for this student
                        final bestResult =
                            _bestResults[student.rno];

                        String subtitle = 'Roll No: ${student.rno}';
                        if (bestResult != null) {
                          final pct =
                              (bestResult.similarityScore * 100)
                                  .toStringAsFixed(1);
                          subtitle =
                              'Roll No: ${student.rno} - $pct% match';
                        }

                        return ListTile(
                          key: ValueKey(student.rno),
                          leading: CircleAvatar(
                            radius: 20,
                            child: student.photoUrl.isNotEmpty
                                ? ClipOval(
                                    child: CachedNetworkImage(
                                      imageUrl: student.photoUrl,
                                      cacheManager: null,
                                      imageBuilder:
                                          (context, imageProvider) =>
                                              Image(
                                        image: imageProvider,
                                        width: 40,
                                        height: 40,
                                        fit: BoxFit.cover,
                                      ),
                                      placeholder: (context, url) =>
                                          Container(
                                        width: 40,
                                        height: 40,
                                        color: Colors.grey.shade200,
                                      ),
                                      errorWidget:
                                          (context, url, error) => Text(
                                        student.name.isNotEmpty
                                            ? student.name[0]
                                                .toUpperCase()
                                            : '?',
                                      ),
                                    ),
                                  )
                                : Text(student.name.isNotEmpty
                                    ? student.name[0].toUpperCase()
                                    : '?'),
                          ),
                          title: Text(student.name),
                          subtitle: Text(subtitle),
                          trailing: GestureDetector(
                            onTap: () =>
                                _toggleStudentStatus(student.rno),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: isPresent
                                    ? Colors.green
                                    : Colors.red,
                                borderRadius:
                                    BorderRadius.circular(16),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    isPresent
                                        ? Icons.check
                                        : Icons.close,
                                    color: Colors.white,
                                    size: 16,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    isPresent
                                        ? 'Present'
                                        : 'Absent',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── ACTION BUTTONS ──
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            child: _buildActionButtons(),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    // State 1: No images yet – show Add Photos button
    if (_images.isEmpty) {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          onPressed: _pickImages,
          icon: const Icon(Icons.add_photo_alternate),
          label: const Text('Add Photos'),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            backgroundColor: Theme.of(context).colorScheme.primary,
            foregroundColor: Colors.white,
          ),
        ),
      );
    }

    // State 2: Images selected but not all processed – show Add More + Take Attendance
    if (!_allProcessed || _images.any((e) => e.status == ImageStatus.pending)) {
      return Column(
        children: [
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _isProcessing ? null : _pickImages,
                  icon: const Icon(Icons.add_photo_alternate),
                  label: const Text('Add More'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: BorderSide(
                        color: Theme.of(context).colorScheme.primary),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _isProcessing ? null : _processAllImages,
                  icon: Icon(_isProcessing
                      ? Icons.hourglass_top
                      : Icons.face_retouching_natural),
                  label: Text(
                      _isProcessing ? 'Processing...' : 'Take Attendance'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    backgroundColor: _isProcessing
                        ? Colors.grey
                        : Theme.of(context).colorScheme.primary,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ],
      );
    }

    // State 3: All processed – show Add More, Save, + Bluetooth
    return Column(
      children: [
        // Add more photos row
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: _isProcessing ? null : _pickImages,
            icon: const Icon(Icons.add_photo_alternate),
            label: const Text('Add More Photos'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              side:
                  BorderSide(color: Theme.of(context).colorScheme.primary),
            ),
          ),
        ),
        const SizedBox(height: 12),
        // Save + Bluetooth row
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _isProcessing ? null : _proceedToConfirmation,
                icon: const Icon(Icons.save),
                label: const Text('Save'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _isProcessing
                    ? null
                    : () {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (_) => AttendanceOrchestrationPage(
                              classModel: widget.classModel,
                              initialStudentStatuses: _studentStatuses,
                              processedImagePath: _images
                                  .where((e) =>
                                      e.status == ImageStatus.completed)
                                  .firstOrNull
                                  ?.processedImagePath,
                            ),
                          ),
                        );
                      },
                icon: const Icon(Icons.bluetooth_searching),
                label: const Text('+ Bluetooth'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Helper to track which images a recognized person appeared in.
class _DetailedResult {
  final RecognitionResultModel result;
  final int imageIndex;
  final Set<int> imageIndices;

  _DetailedResult({required this.result, required this.imageIndex})
      : imageIndices = {imageIndex};
}
