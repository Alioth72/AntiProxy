"use client"

import { useEffect } from "react"
import { X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TermsAndConditionsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TermsAndConditionsModal({ isOpen, onClose }: TermsAndConditionsModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      window.addEventListener("keydown", handleEscape)
    }
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full bg-background flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <h1 className="text-2xl font-bold text-foreground">Terms & Conditions</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-muted"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Introduction */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to the Academic Analytics Dashboard System ("the System"), a comprehensive platform designed to
                facilitate academic management, attendance tracking, marks analysis, and departmental oversight within
                educational institutions. This System is operated and maintained for the exclusive use of authorized
                personnel including Teachers, Heads of Department (HOD), and Administrators.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                These Terms and Conditions ("Terms") constitute a legally binding agreement between you ("User," "you,"
                or "your") and the institution operating this System ("Institution," "we," "us," or "our"). By
                accessing, registering for, or using any part of this System, you acknowledge that you have read,
                understood, and agree to be bound by these Terms in their entirety.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The System serves as a centralized hub for academic data management, enabling seamless coordination
                between faculty members, department heads, and administrative staff. It is imperative that all users
                understand their responsibilities and the legal implications of their interactions with this platform.
              </p>
            </section>

            {/* Acceptance of Terms */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
                2. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By clicking "Sign In," creating an account, or otherwise accessing the System, you expressly agree to
                comply with and be bound by these Terms, as well as any additional guidelines, policies, or rules that
                may be posted on the System from time to time. If you do not agree with any provision of these Terms,
                you must immediately discontinue use of the System.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Your continued use of the System following the posting of any changes to these Terms constitutes
                acceptance of those changes. It is your responsibility to review these Terms periodically for updates.
                The Institution reserves the right to modify, suspend, or discontinue any aspect of the System at any
                time without prior notice.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                These Terms apply to all users of the System, regardless of their role or level of access. Additional
                terms may apply to specific features or services within the System, and such terms will be presented to
                you at the time of access to those features.
              </p>
            </section>

            {/* User Roles & Responsibilities */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
                3. User Roles & Responsibilities
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The System accommodates three primary user roles, each with distinct responsibilities and access
                privileges:
              </p>

              <div className="space-y-4 pl-4">
                <div>
                  <h3 className="font-medium text-foreground">3.1 Teacher Role</h3>
                  <p className="text-muted-foreground leading-relaxed mt-2">
                    Teachers are responsible for accurately recording student attendance, entering assessment marks,
                    managing course materials, and maintaining up-to-date records for all assigned classes. Teachers
                    must ensure that all data entered is accurate, timely, and compliant with institutional guidelines.
                    Teachers shall not access data outside their assigned courses or attempt to modify records beyond
                    their authorized scope.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground">3.2 Head of Department (HOD) Role</h3>
                  <p className="text-muted-foreground leading-relaxed mt-2">
                    HODs are entrusted with departmental oversight responsibilities, including monitoring teacher
                    performance, reviewing aggregate attendance and marks data, generating departmental reports, and
                    ensuring compliance with academic standards. HODs must maintain confidentiality of sensitive
                    departmental information and may not disclose performance data to unauthorized parties. HODs are
                    responsible for verifying the accuracy of data within their department.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-foreground">3.3 Administrator Role</h3>
                  <p className="text-muted-foreground leading-relaxed mt-2">
                    Administrators possess elevated system privileges, including user account management, system
                    configuration, cross-departmental data access, and audit log review. Administrators bear the highest
                    level of responsibility for data integrity and system security. Any misuse of administrative
                    privileges will result in immediate termination of access and potential legal action.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Usage Policy */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
                4. Data Usage Policy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                All data processed through this System is collected, stored, and utilized solely for legitimate
                educational and administrative purposes. The Institution is committed to protecting user privacy and
                handling all personal and academic data in accordance with applicable data protection regulations.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Data collected may include, but is not limited to: user identification information, login credentials,
                access timestamps, IP addresses, device information, academic records, attendance data, assessment
                scores, and any other information necessary for the proper functioning of the System.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Users acknowledge that their activities within the System may be monitored and logged for security,
                compliance, and quality assurance purposes. The Institution may analyze aggregated, anonymized data for
                research and system improvement purposes without individual user consent.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Personal data will not be shared with third parties except as required by law, with user consent, or as
                necessary to provide System services. Users have the right to request access to their personal data and
                to request corrections to inaccurate information, subject to verification procedures.
              </p>
            </section>

            {/* Attendance & Marks Data Handling */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
                5. Attendance & Marks Data Handling
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Attendance and marks data constitute critical academic records that require the highest standards of
                accuracy and integrity. Users responsible for entering this data must exercise due diligence to ensure
                all entries are correct, complete, and timely.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Once attendance or marks data is submitted, modifications may only be made through authorized correction
                procedures, which require appropriate approvals and documentation. All changes to submitted data are
                permanently logged in the System audit trail, including the identity of the user making the change, the
                timestamp, and the nature of the modification.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Falsification, manipulation, or unauthorized alteration of attendance or marks data is strictly
                prohibited and constitutes a serious violation of these Terms. Such actions may result in disciplinary
                measures, termination of employment, and potential criminal prosecution under applicable laws governing
                academic fraud and data tampering.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Users must report any discrepancies, errors, or suspicious activities related to attendance or marks
                data to the appropriate authority immediately upon discovery.
              </p>
            </section>

            {/* Confidentiality Requirements */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
                6. Confidentiality Requirements
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                All information accessed through the System is confidential and proprietary to the Institution. Users
                are obligated to maintain strict confidentiality regarding all data, reports, analytics, and any other
                information obtained through the System.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Confidential information may not be disclosed, discussed, or shared with any unauthorized individuals,
                including but not limited to: family members, friends, colleagues without appropriate access, media
                representatives, or any external parties. This obligation of confidentiality survives the termination of
                your access to the System.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Users must take all reasonable precautions to prevent unauthorized access to confidential information,
                including but not limited to: securing devices used to access the System, using strong and unique
                passwords, logging out of the System when not in use, and not accessing the System on public or
                unsecured networks.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Breach of confidentiality may result in immediate termination of access, disciplinary action, civil
                liability for damages, and criminal prosecution where applicable.
              </p>
            </section>

            {/* System Access Rules */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
                7. System Access Rules
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Access to the System is granted on a need-to-know and role-appropriate basis. Users are assigned
                specific access levels commensurate with their responsibilities, and must not attempt to access
                features, data, or areas of the System beyond their authorized scope.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                User credentials (username and password) are personal and non-transferable. Users must not share their
                login credentials with any other person, including colleagues, supervisors, or IT personnel. Any
                activity conducted using your credentials will be attributed to you and you will be held responsible for
                such activity.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Users must immediately report any suspected unauthorized access, credential compromise, or security
                incident to the System administrator. Failure to report such incidents may result in disciplinary
                action.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The Institution reserves the right to suspend or terminate access to the System at any time, with or
                without cause, and with or without notice. Access may be revoked due to, but not limited to: violation
                of these Terms, security concerns, changes in employment status, or system maintenance requirements.
              </p>
            </section>

            {/* Misuse & Violations */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
                8. Misuse & Violations
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The following actions constitute misuse of the System and are strictly prohibited:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
                <li>Attempting to gain unauthorized access to any part of the System or its associated networks</li>
                <li>Using the System for any illegal, fraudulent, or malicious purposes</li>
                <li>Introducing viruses, malware, or any other harmful code into the System</li>
                <li>Interfering with or disrupting the System's operation or the servers/networks connected to it</li>
                <li>Harvesting, scraping, or collecting user information without authorization</li>
                <li>Impersonating another user or misrepresenting your identity or role</li>
                <li>Circumventing, disabling, or interfering with security features of the System</li>
                <li>Using automated tools, bots, or scripts to access the System without authorization</li>
                <li>Copying, distributing, or disclosing any part of the System without permission</li>
                <li>Taking screenshots, recordings, or copies of confidential data for unauthorized purposes</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Violations of these Terms will be investigated thoroughly. Depending on the severity of the violation,
                consequences may include: verbal or written warnings, temporary suspension of access, permanent
                termination of access, disciplinary action through institutional procedures, civil litigation for
                damages, and referral to law enforcement for criminal prosecution.
              </p>
            </section>

            {/* Limitations of Liability */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
                9. Limitations of Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The System is provided on an "as is" and "as available" basis. While the Institution strives to maintain
                System availability and data accuracy, we make no warranties, express or implied, regarding the System's
                reliability, accuracy, completeness, or fitness for any particular purpose.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The Institution shall not be liable for any direct, indirect, incidental, special, consequential, or
                exemplary damages arising from: your use or inability to use the System; unauthorized access to or
                alteration of your data; any errors, mistakes, or inaccuracies in the System; system downtime or
                interruptions; or any other matter relating to the System.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Users are responsible for maintaining their own backups of critical data and for verifying the accuracy
                of data retrieved from the System before relying upon it for any official purpose.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                In no event shall the Institution's total liability exceed the amount paid by you, if any, for accessing
                the System during the twelve (12) months preceding the claim.
              </p>
            </section>

            {/* Security Practices */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
                10. Security Practices
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The Institution implements industry-standard security measures to protect the System and its data,
                including but not limited to: encryption of data in transit and at rest, secure authentication
                protocols, regular security audits and vulnerability assessments, access logging and monitoring, and
                intrusion detection systems.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Users must adhere to the following security practices: use strong, unique passwords with a minimum of 12
                characters including uppercase, lowercase, numbers, and special characters; change passwords regularly
                and immediately upon suspicion of compromise; enable multi-factor authentication where available; keep
                devices used to access the System updated with the latest security patches; and access the System only
                from secure, trusted networks.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Users must not store System credentials or sensitive data in unsecured locations, including plain text
                files, sticky notes, shared documents, or browser auto-fill features on shared devices.
              </p>
            </section>

            {/* Governing Law */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">11. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
                the Institution operates, without regard to its conflict of law provisions. Any disputes arising from or
                relating to these Terms or the use of the System shall be subject to the exclusive jurisdiction of the
                courts located in said jurisdiction.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Users agree to submit to the personal jurisdiction of such courts and waive any objections based on
                venue or inconvenient forum. The Institution's failure to enforce any provision of these Terms shall not
                constitute a waiver of that provision or any other provision.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, such provision shall be
                modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall
                continue in full force and effect.
              </p>
            </section>

            {/* Modification of Terms */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
                12. Modification of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The Institution reserves the right to modify these Terms at any time, in its sole discretion. Changes
                will be effective immediately upon posting to the System or upon notification to users via email or
                System announcement. The date of the most recent revision will be indicated at the top of these Terms.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                It is your responsibility to review these Terms periodically for changes. Your continued use of the
                System following the posting of revised Terms constitutes your acceptance of such changes. If you do not
                agree to the modified Terms, you must discontinue use of the System immediately.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Material changes to these Terms may be communicated through prominent notices on the System login page
                or via direct communication to registered users. Users may be required to re-accept the Terms following
                significant modifications.
              </p>
            </section>

            {/* Contact Information */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
                13. Contact Information
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions, concerns, or inquiries regarding these Terms or the System, please contact:
              </p>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-foreground">
                  <strong>System Administrator</strong>
                </p>
                <p className="text-muted-foreground">Academic Analytics Dashboard Support</p>
                <p className="text-muted-foreground">Email: support@academicanalytics.edu</p>
                <p className="text-muted-foreground">Phone: +1 (555) 123-4567</p>
                <p className="text-muted-foreground">Hours: Monday - Friday, 8:00 AM - 5:00 PM</p>
              </div>
              <p className="text-muted-foreground leading-relaxed mt-4">
                For urgent security incidents or suspected breaches, please contact the IT Security Team immediately at
                security@academicanalytics.edu or the 24/7 security hotline at +1 (555) 987-6543.
              </p>
            </section>

            {/* Warning Section */}
            <section className="space-y-4 mt-12">
              <div className="border-2 border-amber-500 bg-amber-500/10 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-amber-500 flex-shrink-0" />
                  <h2 className="text-xl font-bold text-amber-600 dark:text-amber-400">WARNING</h2>
                </div>
                <p className="text-foreground font-medium leading-relaxed">
                  This system stores sensitive academic data, including internal course structures, departmental
                  analytics, project information, teacher records, and student-related datasets. It may also contain
                  uploaded media such as photographs or supporting documents.
                </p>
                <p className="text-foreground font-bold leading-relaxed">
                  Unauthorized sharing, duplication, or distribution of any content from this platform is strictly
                  prohibited and may result in disciplinary or legal action.
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  By using this System, you acknowledge that you understand the sensitive nature of the data contained
                  within and accept full responsibility for maintaining its confidentiality and integrity. Violations
                  will be pursued to the fullest extent permitted by law.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="pt-8 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">Last Updated: December 2025</p>
              <p className="text-sm text-muted-foreground mt-2">
                Academic Analytics Dashboard System - All Rights Reserved
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
