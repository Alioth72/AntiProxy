import 'package:flutter/material.dart';

class RecognitionResultModel {
  final Rect boundingBox;
  final String name;
  final String? personId;  // Roll number from face recognition
  final double similarityScore;

  RecognitionResultModel({
    required this.boundingBox,
    required this.name,
    this.personId,  // Optional for backward compatibility
    required this.similarityScore,
  });

  // Factory constructor to create an instance from a JSON map
  factory RecognitionResultModel.fromJson(Map<String, dynamic> json) {
    // Assuming the bounding box in JSON is a map like {'left': 10.0, 'top': 20.0, ...}
    final box = json['boundingBox'];
    return RecognitionResultModel(
      boundingBox: Rect.fromLTWH(
        box['left'].toDouble(),
        box['top'].toDouble(),
        box['width'].toDouble(),
        box['height'].toDouble(),
      ),
      name: json['name'],
      personId: json['personId'] as String?,  // Can be null for unknown faces
      similarityScore: json['similarityScore'].toDouble(),
    );
  }

  // Method to convert an instance to a JSON map
  Map<String, dynamic> toJson() {
    return {
      'boundingBox': {
        'left': boundingBox.left,
        'top': boundingBox.top,
        'width': boundingBox.width,
        'height': boundingBox.height,
      },
      'name': name,
      'personId': personId,
      'similarityScore': similarityScore,
    };
  }
}