"use client"

import {
  ArrowLeft,
  AlertTriangle,
  Shield,
  Lock,
  Users,
  Database,
  FileText,
  Scale,
  Eye,
  UserCheck,
  ClipboardList,
  Ban,
  RefreshCw,
  Mail,
} from "lucide-react"
import Link from "next/link"
import { PopupNotice } from "@/components/popup-notice"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Popup Notice - Only appears on this page */}
      <PopupNotice message="Read Terms and Condition" duration={4500} />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Scale className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms and Conditions</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Please read these terms and conditions carefully before using the Academic Analytics Dashboard. By accessing
            or using this system, you agree to be bound by these terms.
          </p>
          <p className="text-sm text-muted-foreground mt-4">Last Updated: January 2025</p>
        </div>

        {/* Terms Content */}
        <div className="space-y-8">
          {/* Section 1: Introduction */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction and Acceptance</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    Welcome to the Academic Analytics Dashboard ("System", "Platform", "Service"). This System is
                    designed exclusively for educational institutions to manage, analyze, and report academic
                    performance data, teacher information, departmental metrics, and administrative functions.
                  </p>
                  <p>
                    By accessing, registering for, or using this System, you ("User", "You") acknowledge that you have
                    read, understood, and agree to be legally bound by these Terms and Conditions ("Terms",
                    "Agreement"), along with our Privacy Policy and any additional guidelines or rules applicable to
                    specific services or features.
                  </p>
                  <p>
                    If you do not agree with any part of these Terms, you must immediately cease using the System and
                    contact your institutional administrator for account deactivation. Continued use of the System
                    constitutes your ongoing acceptance of these Terms and any modifications thereof.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Data Collection */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Data Collection and Processing</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    The System collects, processes, and stores various types of data essential for its operation and the
                    fulfillment of its educational analytics purposes. This data collection is conducted in accordance
                    with applicable data protection laws and regulations.
                  </p>
                  <p>
                    <strong className="text-foreground">2.1 Types of Data Collected:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>Personal Identification Data:</strong> Full name, employee ID, institutional email
                      address, contact information, department affiliation, designation, and profile photographs.
                    </li>
                    <li>
                      <strong>Academic Performance Data:</strong> Student grades, assessment scores, attendance records,
                      course completion rates, learning outcomes, and performance analytics.
                    </li>
                    <li>
                      <strong>Professional Data:</strong> Teaching assignments, course loads, publication records,
                      research activities, professional development records, and performance evaluations.
                    </li>
                    <li>
                      <strong>System Usage Data:</strong> Login timestamps, session duration, feature utilization
                      patterns, report generation history, and system interaction logs.
                    </li>
                    <li>
                      <strong>Technical Data:</strong> IP addresses, browser type, device information, operating system,
                      and other technical identifiers necessary for system security and optimization.
                    </li>
                  </ul>
                  <p>
                    <strong className="text-foreground">2.2 Purpose of Data Collection:</strong>
                  </p>
                  <p>
                    All collected data is used exclusively for legitimate educational and administrative purposes,
                    including but not limited to: academic performance analysis, institutional reporting, accreditation
                    compliance, resource allocation planning, and quality assurance initiatives.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Access Control */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Access Control and Authentication</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    Access to the System is strictly controlled through a role-based access control (RBAC) mechanism.
                    Each user is assigned specific permissions based on their institutional role and responsibilities.
                  </p>
                  <p>
                    <strong className="text-foreground">3.1 User Authentication Requirements:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Users must authenticate using their institutional credentials issued by authorized administrators.
                    </li>
                    <li>
                      Passwords must meet minimum security requirements: at least 8 characters, including uppercase,
                      lowercase, numbers, and special characters.
                    </li>
                    <li>
                      Multi-factor authentication (MFA) may be required for accessing sensitive data or administrative
                      functions.
                    </li>
                    <li>Session tokens expire after periods of inactivity to prevent unauthorized access.</li>
                  </ul>
                  <p>
                    <strong className="text-foreground">3.2 Access Levels:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>Teacher Level:</strong> Access to personal dashboard, assigned courses, student
                      performance data for their classes, and personal analytics.
                    </li>
                    <li>
                      <strong>HOD Level:</strong> Access to departmental data, all teachers within the department,
                      comparative analytics, and departmental reporting tools.
                    </li>
                    <li>
                      <strong>Admin Level:</strong> Full system access including user management, system configuration,
                      institution-wide analytics, and audit logs.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Limitations of Use */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Ban className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Limitations of Use</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    Users are granted a limited, non-exclusive, non-transferable license to access and use the System
                    solely for legitimate educational and administrative purposes. The following activities are strictly
                    prohibited:
                  </p>
                  <p>
                    <strong className="text-foreground">4.1 Prohibited Activities:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Sharing login credentials with any other individual, including colleagues or family members.
                    </li>
                    <li>Attempting to access data or features beyond your authorized access level.</li>
                    <li>
                      Downloading, copying, or distributing sensitive data for purposes not authorized by the
                      institution.
                    </li>
                    <li>Using automated tools, scripts, or bots to access or scrape data from the System.</li>
                    <li>Attempting to reverse engineer, decompile, or disassemble any part of the System.</li>
                    <li>Introducing malware, viruses, or any malicious code into the System.</li>
                    <li>Using the System to harass, discriminate against, or harm any individual.</li>
                    <li>Misrepresenting your identity or authority within the System.</li>
                  </ul>
                  <p>
                    <strong className="text-foreground">4.2 Data Export Restrictions:</strong>
                  </p>
                  <p>
                    Export of data from the System is subject to institutional policies and may require explicit
                    authorization from department heads or administrators. All exported data must be handled in
                    compliance with data protection regulations and institutional confidentiality requirements.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Privacy Policy */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Privacy Policy</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    We are committed to protecting the privacy and security of all personal and institutional data
                    processed through this System. This section outlines our privacy practices and your rights regarding
                    your data.
                  </p>
                  <p>
                    <strong className="text-foreground">5.1 Data Protection Principles:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>Lawfulness and Transparency:</strong> All data processing activities are conducted
                      lawfully, fairly, and in a transparent manner.
                    </li>
                    <li>
                      <strong>Purpose Limitation:</strong> Data is collected for specified, explicit, and legitimate
                      purposes and not processed in ways incompatible with those purposes.
                    </li>
                    <li>
                      <strong>Data Minimization:</strong> We collect only the data necessary for the specified purposes.
                    </li>
                    <li>
                      <strong>Accuracy:</strong> We take reasonable steps to ensure data accuracy and enable corrections
                      when necessary.
                    </li>
                    <li>
                      <strong>Storage Limitation:</strong> Data is retained only for as long as necessary for the
                      purposes for which it was collected.
                    </li>
                    <li>
                      <strong>Security:</strong> Appropriate technical and organizational measures are implemented to
                      protect data against unauthorized access, alteration, or destruction.
                    </li>
                  </ul>
                  <p>
                    <strong className="text-foreground">5.2 Your Privacy Rights:</strong>
                  </p>
                  <p>
                    Subject to applicable laws, you may have rights to access, rectify, erase, restrict processing, or
                    port your personal data. To exercise these rights, please contact your institutional data protection
                    officer or system administrator.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Teacher Responsibilities */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <UserCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Teacher Responsibilities</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    Teachers using this System bear specific responsibilities to ensure the integrity, accuracy, and
                    confidentiality of the academic data they manage.
                  </p>
                  <p>
                    <strong className="text-foreground">6.1 Data Entry and Accuracy:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Enter all academic data (grades, attendance, assessments) accurately and in a timely manner.
                    </li>
                    <li>
                      Review and verify data before submission to prevent errors that could affect student records.
                    </li>
                    <li>Report any data discrepancies or errors to the department head immediately upon discovery.</li>
                    <li>Maintain current and accurate personal and professional information in your profile.</li>
                  </ul>
                  <p>
                    <strong className="text-foreground">6.2 Confidentiality Obligations:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Treat all student information as strictly confidential and share only with authorized personnel.
                    </li>
                    <li>Never discuss individual student performance data in public or unauthorized settings.</li>
                    <li>Ensure that screens displaying sensitive data are not visible to unauthorized individuals.</li>
                    <li>Log out of the System when leaving your workstation, even temporarily.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: HOD Responsibilities */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">
                  7. Head of Department (HOD) Responsibilities
                </h2>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    Heads of Department have elevated access privileges and correspondingly greater responsibilities for
                    data governance within their departments.
                  </p>
                  <p>
                    <strong className="text-foreground">7.1 Supervisory Responsibilities:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Monitor departmental data quality and ensure compliance with institutional data standards.</li>
                    <li>Review and approve sensitive data operations, including bulk exports or modifications.</li>
                    <li>Provide guidance to teachers on proper System usage and data handling procedures.</li>
                    <li>Escalate security incidents or policy violations to the administration promptly.</li>
                  </ul>
                  <p>
                    <strong className="text-foreground">7.2 Reporting Obligations:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Generate and review departmental reports as required by institutional policies.</li>
                    <li>Ensure accuracy of departmental analytics before submission to administration.</li>
                    <li>Maintain documentation of departmental data access and usage patterns.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8: Admin Responsibilities */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Administrator Responsibilities</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    System Administrators possess the highest level of access and are responsible for maintaining the
                    overall security, integrity, and proper functioning of the System.
                  </p>
                  <p>
                    <strong className="text-foreground">8.1 System Management:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Maintain and update user accounts, permissions, and access levels in accordance with institutional
                      policies.
                    </li>
                    <li>
                      Implement and enforce security measures to protect system integrity and data confidentiality.
                    </li>
                    <li>Conduct regular audits of system access logs and user activities.</li>
                    <li>Coordinate system updates, backups, and disaster recovery procedures.</li>
                  </ul>
                  <p>
                    <strong className="text-foreground">8.2 Compliance and Governance:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Ensure System operations comply with applicable laws, regulations, and institutional policies.
                    </li>
                    <li>
                      Respond to data access requests and privacy inquiries in accordance with legal requirements.
                    </li>
                    <li>Document all significant system changes and maintain comprehensive audit trails.</li>
                    <li>Provide training and support to users on System features and security practices.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9: Consent Agreement */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Consent Agreement</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>By using this System, you explicitly consent to the following:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>Data Processing:</strong> You consent to the collection, processing, and storage of your
                      personal and professional data as described in these Terms and our Privacy Policy.
                    </li>
                    <li>
                      <strong>System Monitoring:</strong> You acknowledge that your activities within the System may be
                      monitored and logged for security and compliance purposes.
                    </li>
                    <li>
                      <strong>Communication:</strong> You agree to receive system notifications, updates, and important
                      announcements related to your use of the System.
                    </li>
                    <li>
                      <strong>Data Sharing:</strong> You consent to the sharing of your data with authorized personnel
                      within the institution as necessary for legitimate educational and administrative purposes.
                    </li>
                    <li>
                      <strong>Terms Updates:</strong> You acknowledge that these Terms may be updated periodically, and
                      continued use of the System constitutes acceptance of any modifications.
                    </li>
                  </ul>
                  <p>
                    This consent may be withdrawn at any time by discontinuing use of the System and requesting account
                    deactivation from your institutional administrator. However, withdrawal of consent may affect your
                    ability to perform job-related functions that require System access.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 10: Modifications */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Modifications to Terms</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>
                    We reserve the right to modify, amend, or update these Terms and Conditions at any time to reflect
                    changes in our practices, legal requirements, or System functionality.
                  </p>
                  <p>
                    <strong className="text-foreground">10.1 Notification of Changes:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Material changes will be communicated through System notifications, email, or prominent notices
                      within the application.
                    </li>
                    <li>
                      The "Last Updated" date at the top of this document will be revised to reflect the most recent
                      modification.
                    </li>
                    <li>Users are encouraged to review these Terms periodically to stay informed of any changes.</li>
                  </ul>
                  <p>
                    <strong className="text-foreground">10.2 Acceptance of Modified Terms:</strong>
                  </p>
                  <p>
                    Continued use of the System following any modifications constitutes your acceptance of the revised
                    Terms. If you do not agree with the modified Terms, you must discontinue use of the System and
                    contact your administrator for account deactivation.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 11: Contact Information */}
          <section className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact Information</h2>
                <div className="text-muted-foreground space-y-3">
                  <p>For questions, concerns, or requests related to these Terms and Conditions, please contact:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>System Administrator:</strong> admin@institution.edu
                    </li>
                    <li>
                      <strong>Data Protection Officer:</strong> privacy@institution.edu
                    </li>
                    <li>
                      <strong>Technical Support:</strong> support@institution.edu
                    </li>
                  </ul>
                  <p>
                    For urgent security concerns or to report potential data breaches, please contact the System
                    Administrator immediately through your institution's emergency communication channels.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Warning Message */}
          <section className="bg-amber-500/10 border-2 border-amber-500/50 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-amber-500 mb-3">Important Warning</h2>
                <p className="text-foreground font-medium">
                  This project contains sensitive project details, teacher information, photos, and other data. Handle
                  responsibly.
                </p>
                <p className="text-muted-foreground mt-3">
                  Unauthorized access, disclosure, or misuse of this information may result in disciplinary action,
                  termination of employment, and/or legal prosecution under applicable data protection and privacy laws.
                  All users are legally and ethically obligated to protect the confidentiality and integrity of the data
                  entrusted to them through this System.
                </p>
              </div>
            </div>
          </section>

          {/* Back to Login Button */}
          <div className="flex justify-center pt-8">
            <Link href="/login">
              <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Back to Login
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
