const LOGO_URL = 'https://res.cloudinary.com/di4pw4x3a/image/upload/og_rwnrny';

// ─────────────────────────────────────────
// Base Wrapper
// ─────────────────────────────────────────
const emailWrapper = (content: string) => `
  <div style="background:#f4f4f4; padding: 40px 0; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

      <!-- Header -->
      <div style="background: #19252F; padding: 24px 32px; text-align: center;">
        <img src="${LOGO_URL}" alt="HireHub JA" style="height: 52px;" />
      </div>

      <!-- Body -->
      <div style="padding: 32px;">
        ${content}
      </div>

      <!-- Footer -->
      <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 32px; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #374151; font-weight: 600;">HireHub JA — Connecting Talent with Opportunity</p>
        <p style="margin: 0 0 4px; font-size: 12px; color: #6b7280;">
          📧 <a href="mailto:support@hirehubja.com" style="color: #74B804; text-decoration: none;">support@hirehubja.com</a>
          &nbsp;·&nbsp;
          🌐 <a href="https://www.hirehubja.com" style="color: #74B804; text-decoration: none;">www.hirehubja.com</a>
          &nbsp;·&nbsp;
          📍 Montego Bay, Jamaica
        </p>
        <p style="margin: 12px 0 0; font-size: 11px; color: #9ca3af;">
          © ${new Date().getFullYear()} HireHub JA. All rights reserved.<br/>
          This email and any attachments are confidential and intended solely for the recipient.
        </p>
      </div>

    </div>
  </div>
`;

// ─────────────────────────────────────────
// Reusable detail table block
// ─────────────────────────────────────────
const detailsCard = (label: string, rows: [string, string][]) => `
  <div style="background: #f9fafb; border-left: 4px solid #74B804; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 24px;">
    <p style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin: 0 0 12px;">${label}</p>
    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
      ${rows.map(([k, v]) => `
        <tr>
          <td style="padding: 5px 0; color: #6b7280; width: 160px;">${k}</td>
          <td style="padding: 5px 0; color: #111827; font-weight: 600;">${v}</td>
        </tr>
      `).join('')}
    </table>
  </div>
`;

// ─────────────────────────────────────────
// Reusable CTA button
// ─────────────────────────────────────────
const ctaButton = (text: string, href: string) => `
  <div style="text-align: center; margin-bottom: 24px;">
    <a href="${href}"
      style="display: inline-block; background: #74B804; color: #ffffff; text-decoration: none;
             padding: 12px 32px; border-radius: 6px; font-size: 15px; font-weight: 600;">
      ${text}
    </a>
  </div>
`;

// ─────────────────────────────────────────
// Reusable alert box (info / warning / success / error)
// ─────────────────────────────────────────
const alertBox = (type: 'success' | 'warning' | 'error' | 'info', message: string) => {
  const colors = {
    success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
    warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
    error:   { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
    info:    { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
  };
  const c = colors[type];
  return `
    <div style="background: ${c.bg}; border-left: 4px solid ${c.border}; border-radius: 0 8px 8px 0;
                padding: 14px 18px; margin-bottom: 24px;">
      <p style="font-size: 14px; color: ${c.text}; margin: 0;">${message}</p>
    </div>
  `;
};

// ─────────────────────────────────────────
// Reusable signature
// ─────────────────────────────────────────
const signature = (team = 'HireHub JA Team') => `
  <p style="font-size: 14px; color: #374151; margin: 0;">
    Best regards,<br/>
    <strong>${team}</strong><br/>
    <span style="font-size: 12px; color: #6b7280;">
      <a href="mailto:support@hirehubja.com" style="color: #74B804; text-decoration: none;">support@hirehubja.com</a>
      &nbsp;·&nbsp;
      <a href="https://www.hirehubja.com" style="color: #74B804; text-decoration: none;">www.hirehubja.com</a>
    </span>
  </p>
`;


// ═══════════════════════════════════════════════════════
// TEMPLATE 1: Interview Invitation
// ═══════════════════════════════════════════════════════
export const interviewInvitationTemplate = (
  candidateName: string,
  company: string,
  position: string,
  date: string,
  time: string,
  platform: string,
  meetingLink: string,
) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Hello <strong>${candidateName}</strong>,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
      We are pleased to inform you that your interview has been successfully scheduled.
      Please review the details below and make sure you are prepared ahead of time.
    </p>

    ${detailsCard('Interview Details', [
      ['Company', company],
      ['Position', position],
      ['Date', date],
      ['Time', time],
      ['Platform', platform],
    ])}

    ${ctaButton('Join Meeting', meetingLink)}
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: -16px 0 24px;">
      Or copy this link: <a href="${meetingLink}" style="color: #74B804;">${meetingLink}</a>
    </p>

    ${alertBox('info', 'Please ensure you join the meeting on time and have a stable internet connection. If you experience any issues, contact us at <a href="mailto:support@hirehubja.com" style="color: #1e40af;">support@hirehubja.com</a>.')}

    ${signature()}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 2: Job Match Notification
// ═══════════════════════════════════════════════════════
export const jobMatchTemplate = (
  seekerName: string,
  jobTitle: string,
  company: string,
  location: string,
  jobLink: string,
) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Hello <strong>${seekerName}</strong>,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
      Great news! A new job has been posted that matches your profile. Don't miss this opportunity — apply before it closes!
    </p>

    ${detailsCard('Job Details', [
      ['Position', jobTitle],
      ['Company', company],
      ['Location', location],
    ])}

    ${ctaButton('View & Apply Now', jobLink)}

    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px;">
      You are receiving this email because your profile matches this job category.
      To manage your job preferences, visit your
      <a href="https://www.hirehubja.com/settings" style="color: #74B804;">account settings</a>.
    </p>

    ${signature()}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 3: New Application Notification (to Employer)
// ═══════════════════════════════════════════════════════
export const applicationNotificationTemplate = (
  employerName: string,
  seekerName: string,
  jobTitle: string,
  applicationLink: string,
) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Hello <strong>${employerName}</strong>,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
      You have received a new application for one of your active job postings on HireHub JA.
    </p>

    ${detailsCard('Application Details', [
      ['Applicant', seekerName],
      ['Position', jobTitle],
      ['Platform', 'HireHub JA'],
    ])}

    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px;">
      Log in to your employer dashboard to view the applicant's full profile, schedule an interview, or update the application status.
    </p>

    ${signature()}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 4: Account Approved
// ═══════════════════════════════════════════════════════
export const accountApprovedTemplate = (fullName: string) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Hello <strong>${fullName}</strong>,</p>

    ${alertBox('success', '🎉 Your account has been successfully verified and approved by the HireHub JA administration team.')}

    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
      You can now access all platform features. Sign in below to get started.
    </p>

    ${ctaButton('Sign In to HireHub JA', 'https://hirehubja.com/auth/signin')}

    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px;">
      If you have any questions or need assistance, our support team is always here to help.<br/>
      📧 <a href="mailto:support@hirehubja.com" style="color: #74B804;">support@hirehubja.com</a>
    </p>

    ${signature()}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 5: Account Rejected / Verification Failed
// ═══════════════════════════════════════════════════════
export const accountRejectedTemplate = (fullName: string, reason: string) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Hello <strong>${fullName}</strong>,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
      Thank you for registering with HireHub JA. After reviewing your submitted information and
      verification documents, we were unable to approve your account at this time.
    </p>

    ${detailsCard('Verification Details', [
      ['Status', 'Not Approved'],
      ['Reason', reason],
    ])}

    ${alertBox('warning', 'Please review the reason above and re-submit the correct information or documents for another review.')}

    ${ctaButton('Re-submit Verification', 'https://www.hirehubja.com/verify')}

    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px;">
      If you believe this is an error or need clarification, please contact our verification team:<br/>
      📧 <a href="mailto:verification@hirehubja.com" style="color: #74B804;">verification@hirehubja.com</a>
      &nbsp;·&nbsp;
      📧 <a href="mailto:support@hirehubja.com" style="color: #74B804;">support@hirehubja.com</a>
    </p>

    ${signature('HireHub JA Verification Team')}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 6: Warning / Suspension Notice
// ═══════════════════════════════════════════════════════
export const warningNoticeTemplate = (fullName: string, reason: string) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Dear <strong>${fullName}</strong>,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
      This notice is to inform you that your account has been flagged for violating the HireHub JA platform policies.
      Our administration team is currently reviewing the matter.
    </p>

    ${detailsCard('Notice Details', [
      ['Notice Type', 'Official Warning'],
      ['Reason', reason],
      ['Reviewed By', 'HireHub JA Administration'],
    ])}

    ${alertBox('error', '⚠️ Failure to comply with platform policies may result in temporary suspension or permanent account removal.')}

    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px;">
      If you wish to appeal this decision or provide additional information, please contact us within 7 days:<br/>
      📧 <a href="mailto:admin@hirehubja.com" style="color: #74B804;">admin@hirehubja.com</a>
      &nbsp;·&nbsp;
      📧 <a href="mailto:support@hirehubja.com" style="color: #74B804;">support@hirehubja.com</a><br/>
      📋 <a href="https://www.hirehubja.com/policies" style="color: #74B804;">View Platform Policies</a>
    </p>

    ${signature('HireHub JA Administration Team')}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 7: Payment Receipt
// ═══════════════════════════════════════════════════════
export const paymentReceiptTemplate = (
  employerName: string,
  receiptId: string,
  paymentDate: string,
  planName: string,
  amount: string,
  paymentMethod: string,
) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Hello <strong>${employerName}</strong>,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
      Thank you for your payment. Your transaction has been successfully processed.
      Please keep this receipt for your records.
    </p>

    ${alertBox('success', '✅ Payment Successfully Completed')}

    ${detailsCard('Payment Receipt', [
      ['Receipt ID', receiptId],
      ['Payment Date', paymentDate],
      ['Plan', planName],
      ['Amount Paid', amount],
      ['Payment Method', paymentMethod],
      ['Status', 'Completed'],
    ])}

    ${ctaButton('View Dashboard', 'https://www.hirehubja.com/employer/dashboard')}

    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px;">
      For billing inquiries or disputes, please contact:<br/>
      📧 <a href="mailto:billing@hirehubja.com" style="color: #74B804;">billing@hirehubja.com</a>
      &nbsp;·&nbsp;
      📧 <a href="mailto:support@hirehubja.com" style="color: #74B804;">support@hirehubja.com</a>
    </p>

    ${signature()}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 8: Subscription Invoice
// ═══════════════════════════════════════════════════════
export const subscriptionInvoiceTemplate = (
  employerName: string,
  invoiceNumber: string,
  invoiceDate: string,
  planName: string,
  duration: string,
  amount: string,
) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Hello <strong>${employerName}</strong>,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
      Your subscription invoice is ready. Thank you for choosing HireHub JA to manage your hiring needs.
    </p>

    ${detailsCard('Invoice Details', [
      ['Invoice Number', invoiceNumber],
      ['Invoice Date', invoiceDate],
      ['Plan Name', planName],
      ['Duration', duration],
      ['Subtotal', amount],
      ['Tax', '$0'],
      ['Total Amount', amount],
    ])}

    ${ctaButton('View My Subscription', 'https://www.hirehubja.com/employer/subscription')}

    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px;">
      For invoice or billing questions, please reach out:<br/>
      📧 <a href="mailto:billing@hirehubja.com" style="color: #74B804;">billing@hirehubja.com</a>
      &nbsp;·&nbsp;
      🌐 <a href="https://www.hirehubja.com" style="color: #74B804;">www.hirehubja.com</a>
    </p>

    ${signature()}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 9: Hiring Confirmation
// ═══════════════════════════════════════════════════════
export const hiringConfirmationTemplate = (
  seekerName: string,
  company: string,
  position: string,
  startDate: string,
  contractDuration: string,
  salaryAmount: string,
) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Congratulations, <strong>${seekerName}</strong>! 🎉</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
      This document confirms that you have officially been hired through the HireHub JA platform.
      We wish you the very best in your new role!
    </p>

    ${alertBox('success', '🎉 Official Hiring Confirmation — You have been successfully hired!')}

    ${detailsCard('Employment Details', [
      ['Company', company],
      ['Position', position],
      ['Start Date', startDate],
      ['Contract Duration', contractDuration],
      ['Salary Amount', salaryAmount],
      ['Salary Status', 'Securely held in HireHub JA Escrow'],
    ])}

    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 14px 18px; margin-bottom: 24px;">
      <p style="font-size: 13px; color: #1e40af; margin: 0;">
        🔒 <strong>Escrow Protection:</strong> Your salary is securely held by HireHub JA until job completion.
        This protects both you and your employer throughout the contract period.
        <a href="https://www.hirehubja.com/escrow-policy" style="color: #1e40af;">Learn more</a>
      </p>
    </div>

    ${ctaButton('View My Dashboard', 'https://www.hirehubja.com/job-seeker/dashboard')}

    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px;">
      If you have any questions about your contract or salary, contact us:<br/>
      📧 <a href="mailto:support@hirehubja.com" style="color: #74B804;">support@hirehubja.com</a>
      &nbsp;·&nbsp;
      🌐 <a href="https://www.hirehubja.com" style="color: #74B804;">www.hirehubja.com</a>
    </p>

    ${signature()}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 10: Report Submission Confirmation
// ═══════════════════════════════════════════════════════
export const reportConfirmationTemplate = (fullName: string, reportId?: string) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Hello <strong>${fullName}</strong>,</p>

    ${alertBox('info', '📋 We have successfully received your report. Our administration team will carefully review the provided information and evidence.')}

    ${reportId ? detailsCard('Report Reference', [
      ['Report ID', reportId],
      ['Status', 'Under Review'],
      ['Team', 'HireHub JA Administration'],
    ]) : ''}

    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
      You will be notified once the investigation process is completed.
      We take all reports seriously and are committed to maintaining a safe and fair platform for everyone.
    </p>

    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px;">
      For urgent matters or follow-ups, please contact:<br/>
      📧 <a href="mailto:reports@hirehubja.com" style="color: #74B804;">reports@hirehubja.com</a>
      &nbsp;·&nbsp;
      📧 <a href="mailto:support@hirehubja.com" style="color: #74B804;">support@hirehubja.com</a>
    </p>

    ${signature('HireHub JA Support Team')}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 11: Password Reset
// ═══════════════════════════════════════════════════════
export const passwordResetTemplate = (fullName: string, resetLink: string) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Hello <strong>${fullName}</strong>,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
      We received a request to reset the password for your HireHub JA account.
      Click the button below to set a new password.
    </p>

    ${ctaButton('Reset My Password', resetLink)}

    ${alertBox('warning', '⏰ This password reset link will expire in <strong>30 minutes</strong>. If you did not request a password reset, please ignore this email or contact support immediately.')}

    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px;">
      For security concerns, please contact us immediately:<br/>
      📧 <a href="mailto:support@hirehubja.com" style="color: #74B804;">support@hirehubja.com</a>
      &nbsp;·&nbsp;
      🌐 <a href="https://www.hirehubja.com" style="color: #74B804;">www.hirehubja.com</a>
    </p>

    ${signature()}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 12: Escrow Payment Notification
// ═══════════════════════════════════════════════════════
export const escrowPaymentTemplate = (
  employerName: string,
  seekerName: string,
  position: string,
  amount: string,
  escrowId: string,
) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Hello <strong>${employerName}</strong>,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
      Your escrow payment has been successfully secured by HireHub JA for the following hire.
    </p>

    ${alertBox('success', '🔒 Escrow Payment Secured — Funds are safely held until job completion.')}

    ${detailsCard('Escrow Details', [
      ['Escrow ID', escrowId],
      ['Employee', seekerName],
      ['Position', position],
      ['Amount Secured', amount],
      ['Status', 'Held in Escrow'],
      ['Platform', 'HireHub JA'],
    ])}

    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px;">
      All salary payments made through HireHub JA are securely held until job completion.
      If any issue occurs during the contract period, you may submit a report for review.
      Our administration team will investigate and take appropriate action per platform policy.<br/><br/>
      📋 <a href="https://www.hirehubja.com/escrow-policy" style="color: #74B804;">View Escrow Policy</a>
      &nbsp;·&nbsp;
      📧 <a href="mailto:billing@hirehubja.com" style="color: #74B804;">billing@hirehubja.com</a>
    </p>

    ${ctaButton('View Escrow Details', 'https://www.hirehubja.com/employer/payments')}

    ${signature()}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 13: Custom Admin Message
// ═══════════════════════════════════════════════════════
export const customMessageTemplate = (message: string) =>
  emailWrapper(`
    <div style="font-size: 15px; color: #374151; line-height: 1.7; white-space: pre-line; margin-bottom: 24px;">
      ${message}
    </div>
    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px;">
      For any questions or support:<br/>
      📧 <a href="mailto:support@hirehubja.com" style="color: #74B804;">support@hirehubja.com</a>
      &nbsp;·&nbsp;
      🌐 <a href="https://www.hirehubja.com" style="color: #74B804;">www.hirehubja.com</a>
      &nbsp;·&nbsp;
      📍 Montego Bay, Jamaica
    </p>
    ${signature('HireHub JA Administration Team')}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 14: Withdraw Request Notification
// ═══════════════════════════════════════════════════════
export const withdrawRequestNotificationTemplate = (
  recipientName: string,
  stageLabel: string,
  stageMessage: string,
  orderId: string,
  requestId: string,
  jobSeekerName: string,
  employerName: string,
  jobTitle: string,
  amount: string,
  statusLabel: string,
) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Hello <strong>${recipientName}</strong>,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
      ${stageMessage}
    </p>

    ${alertBox('info',
       stageLabel)}

    ${detailsCard('Withdrawal Details', [
      ['Order ID', orderId],
      ['Request ID', requestId],
      ['Job Seeker', jobSeekerName],
      ['Employer', employerName],
      ['Job Title', jobTitle],
      ['Amount', amount],
      ['Status', statusLabel],
    ])}

    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px;">
      Please log in to your HireHub JA dashboard to review the request and complete the next step if required.
    </p>

    ${signature()}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 5b: Emergency Verification Backup Link
// ═══════════════════════════════════════════════════════
export const emergencyVerificationBackupTemplate = (
  fullName: string,
  uploadLink: string,
  roleLabel: string,
) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Hello <strong>${fullName}</strong>,</p>

    ${alertBox('warning', 'This is an emergency verification link issued by the HireHub JA administration team. Please use it only if you were instructed to do so.') }

    <p style="font-size: 15px; color: #374151; margin: 0 0 16px;">
      We created a secure upload link for your ${roleLabel} verification documents. This link is temporary and should be used to complete the missing verification step as soon as possible.
    </p>

    ${ctaButton('Open Secure Upload Page', uploadLink)}

    <p style="font-size: 13px; color: #6b7280; margin: 0 0 24px; word-break: break-word;">
      If the button does not work, copy and paste this link into your browser:<br/>
      <a href="${uploadLink}" style="color: #74B804;">${uploadLink}</a>
    </p>

    ${alertBox('info', 'If you already completed the upload with an admin, no further action is needed. If this email was sent by mistake, please ignore it and contact support.') }

    ${signature('HireHub JA Verification Team')}
  `);


// ═══════════════════════════════════════════════════════
// TEMPLATE 15: OTP Verification
// ═══════════════════════════════════════════════════════
export const otpVerificationTemplate = (
  recipientName: string,
  heading: string,
  otp: string,
  expiryMinutes = 2,
) =>
  emailWrapper(`
    <p style="font-size: 16px; color: #1f2937; margin: 0 0 16px;">Hello <strong>${recipientName}</strong>,</p>
    <p style="font-size: 15px; color: #374151; margin: 0 0 24px;">
      ${heading} Please enter the verification code below to continue.
    </p>

    <div style="background: linear-gradient(135deg, #19252F 0%, #243444 100%); border-radius: 14px; padding: 28px 24px; text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 10px; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #cbd5e1;">
        One-time passcode
      </p>
      <div style="display: inline-block; background: #ffffff; border-radius: 12px; padding: 14px 22px; min-width: 220px;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #74B804; font-family: Arial, sans-serif;">
          ${otp}
        </span>
      </div>
      <p style="margin: 14px 0 0; font-size: 13px; color: #e5e7eb;">
        This code expires in <strong>${expiryMinutes} minutes</strong>.
      </p>
    </div>

    ${alertBox('info', 'For your security, never share this code with anyone. HireHub JA will never ask for your OTP by phone or chat.')}

    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 18px; margin-bottom: 24px;">
      <p style="font-size: 13px; color: #6b7280; margin: 0 0 8px; font-weight: 600;">What to do next</p>
      <ol style="margin: 0; padding-left: 18px; color: #374151; font-size: 14px; line-height: 1.7;">
        <li>Open the HireHub JA verification screen.</li>
        <li>Enter the 6-digit code exactly as shown.</li>
        <li>Complete verification before the code expires.</li>
      </ol>
    </div>

    ${signature()}
  `);
