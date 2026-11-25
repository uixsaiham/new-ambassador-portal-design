import AppIcon from "@/components/AppIcon";
import React from "react";

// Chrome-free PrivacyPolicyContent body. Rendered by BOTH the standalone legal page
// AND the accept-terms modal, so the legal text can never drift between them.
//
// DELIBERATE ARCHIVE DIVERGENCE (2026-10-19): the DPO section named an external DPO
// ("Aphaia Limited", info@bheuni.io) that does not exist. It was removed and every
// contact route in this notice now points at ask@bheuni.io. The version was NOT bumped:
// the backend archive (affiliate-backend/app/policy_seed/privacy_policy.v1.html) is
// append-only and still holds the exact v1 body each ambassador consented to, hashed in
// policy_documents.content_sha256, so consent proof is unaffected. Removing a factually
// false statement about who to contact does not alter anyone's rights, and bumping
// PRIVACY_POLICY_VERSION would have re-gated all 642 ambassadors. Do NOT "fix" the v1
// seed file to match this: it is the evidence, not a copy of the current page. A future
// change that DOES affect rights must ship a new seed file plus a version bump.
export default function PrivacyPolicyContent() {
  return (
          <div className="border-t border-slate-200 pt-6 space-y-8 text-sm text-slate-700 leading-relaxed">
            {/* 1. Personal Information Collected? */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-user-shield text-orange-500 text-sm"></AppIcon>
                1. Personal Information Collected?
              </h2>
              <p>
                BHE UNI is committed to protecting the privacy and security of your personal information. This privacy notice (“this Notice”) describes how we collect and use personal information about you during and after your relationship with us, in accordance with the General Data Protection Regulation (GDPR). It applies to all students.
              </p>
              <p>
                BHE UNI is a “data controller”. This means that we are responsible for deciding how we hold and use personal information about you. We are required under data protection legislation to notify you of the information contained in this Notice.
              </p>
              <p>
                This Notice applies to current and former students. This Notice does not form part of any offer made by BHE UNI to you. We may update this Notice at any time and shall inform you if we make any amendment that will significantly affect your rights.
              </p>
              <p>
                It is important that you read this Notice, together with any other policies we may provide on specific occasions when we are collecting or processing personal information about you, so that you are aware of how and why we are using such information.
              </p>
            </section>

            {/* 2. Data Protection Principles */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-list-check text-orange-500 text-sm"></AppIcon>
                2. Data Protection Principles
              </h2>
              <p>
                We will comply with data protection law. This says that the personal information we hold about you must be:
              </p>
              <ul className="list-disc list-outside space-y-1.5 pl-5 text-slate-600">
                <li>Used lawfully, fairly and in a transparent way.</li>
                <li>Collected only for valid purposes that we have clearly explained to you and not used in any way that is incompatible with those purposes.</li>
                <li>Relevant to the purposes we have told you about and limited only to those purposes.</li>
                <li>Accurate and kept up to date.</li>
                <li>Kept only as long as necessary for the purposes we have told you about.</li>
                <li>Kept securely.</li>
              </ul>
            </section>

            {/* 3. We Hold About You */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-folder-open text-orange-500 text-sm"></AppIcon>
                3. We Hold About You
              </h2>
              <p>
                Personal data, or personal information, means any information about an individual from which that person can be identified. It does not include data where the identity has been removed (anonymous data).
                There are “special categories” of more sensitive personal data which require a higher level of protection.
              </p>
              <p>
                We will collect, store, and use the following categories of personal information about you:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4 text-slate-600 grid md:grid-cols-2 gap-1">
                <li>Personal contact details such as name, title, addresses, telephone numbers, and personal email addresses;</li>
                <li>Date of birth;</li>
                <li>Gender;</li>
                <li>Next of kin and emergency contact information;</li>
                <li>Parent/Guardian contact Information;</li>
                <li>Visa, Nationality, Police Registration and Identification Documents;</li>
                <li>Bank account details;</li>
                <li>Course Information (duration, location and Study Plans);</li>
                <li>Educational information (certificates, right to study);</li>
                <li>Information about your use of IT systems;</li>
                <li>Photographs;</li>
              </ul>
              <p>
                We may also collect, store and use the following “special categories” of more sensitive personal information:
              </p>
              <ul className="list-disc list-outside space-y-1 pl-5 text-slate-600">
                <li>Information about your race, ethnicity and religious beliefs;</li>
                <li>Information about your health, including medical conditions and health records;</li>
                <li>Information about criminal convictions and offences.</li>
              </ul>
            </section>

            {/* 4. Personal Information Collected */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-circle-info text-orange-500 text-sm"></AppIcon>
                4. Personal Information Collected
              </h2>
              <p>
                We collect personal information about students through the application process, either directly from students or on occasions from Agents or Sponsors. We may sometimes collect additional information from third parties including former educational institutions.
                We will collect additional personal information in the course of your period of study with us.
              </p>
              <h4 className="text-slate-900 font-bold text-sm mt-3">ON WHAT BASIS WILL WE USE INFORMATION ABOUT YOU</h4>
              <p>
                We will only use your personal information when the law allows us to. Most commonly, we will use your personal information in the following circumstances:
              </p>
              <ul className="list-disc list-outside space-y-1.5 pl-5 text-slate-600">
                <li>Where we need to enter into the agreement with you to provide the study programme according to BHE UNI Terms and Conditions, and to perform such an agreement once we have entered into it with you.</li>
                <li>Where we need to comply with a legal obligation.</li>
                <li>Where it is necessary for Boost Education Service’s legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests. Such instances may include the prevention of fraud, error, harassment or child abuse.</li>
              </ul>
            </section>

            {/* 5. Which Information We’ll Use */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-gears text-orange-500 text-sm"></AppIcon>
                5. Which Information We’ll Use
              </h2>
              <p>
                We need all the categories of information in the list above primarily to allow us to perform our contract with you and to enable us to comply with legal obligations. In some cases we may use your personal information to pursue legitimate interests of our own or those of third parties, provided your interests and fundamental rights do not override those interests.
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4 text-slate-600 grid md:grid-cols-2 gap-1">
                <li>Making a decision about your application or appointment;</li>
                <li>Determining the terms on which you study with us;</li>
                <li>Checking you are legally entitled to study;</li>
                <li>Providing you with the necessary study material;</li>
                <li>Administering the agreement;</li>
                <li>Education, training and development requirements;</li>
                <li>Complying with health and safety obligations;</li>
                <li>To prevent fraud;</li>
                <li>To monitor IT systems use and ensure security;</li>
                <li>To conduct data analytics studies to review student progression;</li>
                <li>Equal opportunities monitoring;</li>
                <li>Communications and marketing purposes.</li>
              </ul>
              <h4 className="text-slate-900 font-bold text-sm mt-3">IF YOU FAIL TO PROVIDE PERSONAL INFORMATION</h4>
              <p>
                If you fail to provide certain information when requested, we may not be able to perform the agreement we have entered into with you (such as providing a place at an educational establishment), or we may be prevented from complying with our legal obligations (such as to ensure the health and safety of our students).
              </p>
              <h4 className="text-slate-900 font-bold text-sm mt-3">CHANGE OF PURPOSE</h4>
              <p>
                We will only use your personal information for the purposes for which we collected it, unless we reasonably consider that we need to use it for another reason and that reason is compatible with the original purpose.
              </p>
            </section>

            {/* 6. Sensitive Personal Info Usage */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-heart-pulse text-orange-500 text-sm"></AppIcon>
                6. Sensitive Personal Info Usage
              </h2>
              <p>
                "Special categories" of particularly sensitive personal information require higher levels of protection. We need to have further justification for collecting, storing and using this type of personal information. We may process special categories of personal information in the following circumstances:
              </p>
              <ul className="list-disc list-outside space-y-1.5 pl-5 text-slate-600">
                <li>In limited circumstances, with your explicit written consent.</li>
                <li>Where we need to carry out our legal obligations and in line with our Data Protection policy.</li>
                <li>Where it is needed in the public interest, such as for equal opportunities monitoring and in line with our data protection policy.</li>
                <li>Where it is needed to assess your studying capacity on health grounds and to act with a duty of care, subject to appropriate confidentiality safeguards.</li>
              </ul>
            </section>

            {/* 7. Info About Criminal Convictions */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-gavel text-orange-500 text-sm"></AppIcon>
                7. Info About Criminal Convictions
              </h2>
              <p>
                We will only collect and use information about criminal convictions if it is appropriate given the nature of your place of study and where we are legally able to do so. Where appropriate, we will collect information about criminal convictions as part of the application process or we may be notified of such information directly by you in the course of you studying with us. We will use this information to provide the educational establishment you have applied to with the relevant information requested.
              </p>
            </section>

            {/* 8. Automated Decision-Making */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-robot text-orange-500 text-sm"></AppIcon>
                8. Automated Decision-Making
              </h2>
              <p>
                Automated decision-making takes place when an electronic system uses personal information to make a decision without human intervention. We do not envisage that any decisions will be taken about you using automated means; however, we will notify you in writing if this position changes.
              </p>
            </section>

            {/* 9. Data Sharing */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-share-nodes text-orange-500 text-sm"></AppIcon>
                9. Data Sharing
              </h2>
              <p>
                We will share your personal information with third parties where required by law, where it is necessary to administer the working relationship with you, or where we have another legitimate interest in doing so. This includes third-party service providers (such as UKVI, NHS, homestay families, landlords, and guardians) and other entities within our group.
              </p>
            </section>

            {/* 10. Third-Party Service Security */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-shield-halved text-orange-500 text-sm"></AppIcon>
                10. Third-Party Service Security
              </h2>
              <p>
                All our third-party service providers and partners are required to take appropriate security measures to protect your personal information in line with our policies. We do not allow our third-party service providers to use your personal data for their own purposes.
              </p>
            </section>

            {/* 11. Information Outside The EU */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-earth-americas text-orange-500 text-sm"></AppIcon>
                11. Information Outside The EU
              </h2>
              <p>
                We may transfer the personal information we collect about you to countries outside the EU (such as Australia, Canada, New Zealand, Republic of Ireland, USA) in order to perform our contract with you. We have put in place appropriate measures to ensure that your personal information is treated in a way that is consistent with EU and UK data protection laws.
              </p>
            </section>

            {/* 12. Data Security */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-lock text-orange-500 text-sm"></AppIcon>
                12. Data Security
              </h2>
              <p>
                We have put in place appropriate security measures to prevent your personal information from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed. Access to your personal information is limited to those who have a business need to know.
              </p>
            </section>

            {/* 13. Data Retention */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-clock-rotate-left text-orange-500 text-sm"></AppIcon>
                13. Data Retention
              </h2>
              <p>
                We will only retain your personal information for as long as is necessary to fulfil the purposes we collected it for, including satisfying any legal, accounting, or reporting requirements.
              </p>
              <h4 className="text-slate-900 font-bold text-sm mt-3">YOUR RIGHTS IN CONNECTION WITH PERSONAL INFORMATION</h4>
              <p>
                Under certain circumstances, by law you have the right to request access, request correction, request erasure, object to processing, request restriction, or request the transfer of your personal information. If you wish to exercise any of these rights, please contact us at <a href="mailto:ask@bheuni.io" className="text-orange-600 hover:underline">ask@bheuni.io</a>.
              </p>
            </section>

            {/* 14. What We May Need From You */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AppIcon className="fa-solid fa-circle-question text-orange-500 text-sm"></AppIcon>
                14. What We May Need From You
              </h2>
              <p>
                We may need to request specific information from you to help us confirm your identity and ensure your right to access the information. This is a security measure to ensure personal information is not disclosed to unauthorized persons.
              </p>
              <h4 className="text-slate-900 font-bold text-sm mt-3">RIGHT TO WITHDRAW CONSENT</h4>
              <p>
                In circumstances where you have provided your consent, you have the right to withdraw that consent at any time by contacting us at <a href="mailto:ask@bheuni.io" className="text-orange-600 hover:underline">ask@bheuni.io</a>.
              </p>
              <h4 className="text-slate-900 font-bold text-sm mt-3">CONTACT US</h4>
              <p>
                If you have any questions about this privacy notice or how we handle your personal information, please contact us at <a href="mailto:ask@bheuni.io" className="text-orange-600 hover:underline">ask@bheuni.io</a>.
              </p>
            </section>
          </div>
  );
}
