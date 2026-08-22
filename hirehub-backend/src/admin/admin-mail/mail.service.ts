import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {
  interviewInvitationTemplate,
  jobMatchTemplate,
  applicationNotificationTemplate,
  customMessageTemplate,
  withdrawRequestNotificationTemplate,
  accountApprovedTemplate,
  emergencyVerificationBackupTemplate,
} from './mail.templates';
import { SendMailDto } from './dto/mail.dto';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  async sendMail(dto: SendMailDto): Promise<void> {
    let html: string;

    if (dto.emailType === 'interview_invitation') {
      html = interviewInvitationTemplate(
        dto.candidateName ?? '',
        dto.company ?? '',
        dto.position ?? '',
        dto.date ?? '',
        dto.time ?? '',
        dto.platform ?? '',
        dto.meetingLink ?? '',
      );
    } else {
      html = customMessageTemplate(dto.message ?? '');
    }

    await this.transporter.sendMail({
      from: `"HireHub JA" <${process.env.MAIL_USER}>`,
      to: dto.to,
      subject: dto.subject,
      html,
    });
  }

  async sendJobMatchMail(
    to: string,
    seekerName: string,
    jobTitle: string,
    company: string,
    location: string,
    jobLink: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"HireHub JA" <${process.env.MAIL_USER}>`,
      to,
      subject: `New Job Match: ${jobTitle}`,
      html: jobMatchTemplate(seekerName, jobTitle, company, location, jobLink),
    });
  }

  async sendApplicationNotificationMail(
    to: string,
    employerName: string,
    seekerName: string,
    jobTitle: string,
    applicationLink: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"HireHub JA" <${process.env.MAIL_USER}>`,
      to,
      subject: `New Application: ${jobTitle}`,
      html: applicationNotificationTemplate(employerName, seekerName, jobTitle, applicationLink),
    });
  }

  async sendInterviewInvitationMail(
    to: string,
    candidateName: string,
    company: string,
    position: string,
    date: string,
    time: string,
    platform: string,
    meetingLink: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"HireHub JA" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Interview Scheduled — HireHub JA',
      html: interviewInvitationTemplate(
        candidateName, company, position, date, time, platform, meetingLink,
      ),
    });
  }

  async sendWithdrawRequestSubmittedMail(
    to: string,
    recipientName: string,
    orderId: string,
    requestId: string,
    jobSeekerName: string,
    employerName: string,
    jobTitle: string,
    amount: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"HireHub JA" <${process.env.MAIL_USER}>`,
      to,
      subject: `Withdraw Request Submitted - ${orderId}`,
      html: withdrawRequestNotificationTemplate(
        recipientName,
        'Withdraw Request Submitted',
        'A jobseeker has submitted a withdraw request and it is waiting for admin approval.',
        orderId,
        requestId,
        jobSeekerName,
        employerName,
        jobTitle,
        amount,
        'PENDING',
      ),
    });
  }

  async sendWithdrawRequestEmployerConfirmedMail(
    to: string,
    recipientName: string,
    orderId: string,
    requestId: string,
    jobSeekerName: string,
    employerName: string,
    jobTitle: string,
    amount: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"HireHub JA" <${process.env.MAIL_USER}>`,
      to,
      subject: `Withdraw Request Confirmed by Employer - ${orderId}`,
      html: withdrawRequestNotificationTemplate(
        recipientName,
        'Employer Confirmed',
        'The employer has confirmed this withdraw request. It is now waiting for admin approval.',
        orderId,
        requestId,
        jobSeekerName,
        employerName,
        jobTitle,
        amount,
        'PENDING',
      ),
    });
  }

  async sendWithdrawRequestApprovedMail(
    to: string,
    recipientName: string,
    orderId: string,
    requestId: string,
    jobSeekerName: string,
    employerName: string,
    jobTitle: string,
    amount: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"HireHub JA" <${process.env.MAIL_USER}>`,
      to,
      subject: `Withdraw Request Approved - ${orderId}`,
      html: withdrawRequestNotificationTemplate(
        recipientName,
        'Withdraw Request Approved',
        'Admin has approved the withdraw request and the payment has been processed.',
        orderId,
        requestId,
        jobSeekerName,
        employerName,
        jobTitle,
        amount,
        'APPROVED',
      ),
    });
  }

  async sendAccountApprovedMail(to: string, fullName: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"HireHub JA" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Your HireHub JA account has been approved',
      html: accountApprovedTemplate(fullName),
    });
  }

  async sendEmergencyVerificationBackupMail(
    to: string,
    fullName: string,
    uploadLink: string,
    roleLabel: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: `"HireHub JA" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Emergency verification upload link - HireHub JA',
      html: emergencyVerificationBackupTemplate(fullName, uploadLink, roleLabel),
    });
  }
}
