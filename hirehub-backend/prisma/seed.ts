import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });
const demoPassword = 'Password123!';

async function upsertPlan(input: {
  name: string;
  price: number;
  duration: number;
  slotsAvailable: number;
  features: string[];
}) {
  const existing = await prisma.subscriptionPlan.findFirst({
    where: { name: input.name },
  });

  if (existing) {
    return prisma.subscriptionPlan.update({
      where: { id: existing.id },
      data: input,
    });
  }

  return prisma.subscriptionPlan.create({ data: input });
}

async function main() {
  const password = await bcrypt.hash(demoPassword, 10);

  const [technology, hospitality, administration] = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Technology' },
      update: { description: 'Software, data, and digital roles' },
      create: {
        name: 'Technology',
        description: 'Software, data, and digital roles',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Hospitality' },
      update: { description: 'Hotels, restaurants, and guest services' },
      create: {
        name: 'Hospitality',
        description: 'Hotels, restaurants, and guest services',
      },
    }),
    prisma.category.upsert({
      where: { name: 'Administration' },
      update: { description: 'Office, operations, and administrative roles' },
      create: {
        name: 'Administration',
        description: 'Office, operations, and administrative roles',
      },
    }),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password,
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
    },
    create: {
      email: 'admin@example.com',
      password,
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
    },
  });

  await prisma.adminProfile.upsert({
    where: { userId: admin.id },
    update: { fullName: 'HireHub Administrator', phone: '876-555-0100' },
    create: {
      userId: admin.id,
      fullName: 'HireHub Administrator',
      phone: '876-555-0100',
      location: 'Kingston, Jamaica',
    },
  });

  const employer = await prisma.user.upsert({
    where: { email: 'employer@example.com' },
    update: {
      password,
      role: 'EMPLOYER',
      status: 'ACTIVE',
      isVerified: true,
    },
    create: {
      email: 'employer@example.com',
      password,
      role: 'EMPLOYER',
      status: 'ACTIVE',
      isVerified: true,
    },
  });

  const employerProfile = await prisma.employerProfile.upsert({
    where: { userId: employer.id },
    update: {
      companyName: 'Island Digital Ltd.',
      fullName: 'Marsha Campbell',
      phone: '876-555-0101',
      location: 'Kingston, Jamaica',
      about: 'A growing Jamaican team building practical digital products.',
      website: 'https://example.com',
      isVerified: true,
      preferredCategories: { set: [{ id: technology.id }, { id: administration.id }] },
    },
    create: {
      userId: employer.id,
      companyName: 'Island Digital Ltd.',
      fullName: 'Marsha Campbell',
      phone: '876-555-0101',
      location: 'Kingston, Jamaica',
      about: 'A growing Jamaican team building practical digital products.',
      website: 'https://example.com',
      businessRegCertId: 'DEMO-BRC-001',
      licenseFile: 'seed/demo-business-certificate.pdf',
      idCardFront: 'seed/demo-id-front.jpg',
      idCardBack: 'seed/demo-id-back.jpg',
      selfieImage: 'seed/demo-selfie.jpg',
      isVerified: true,
      preferredCategories: { connect: [{ id: technology.id }, { id: administration.id }] },
    },
  });

  const candidate = await prisma.user.upsert({
    where: { email: 'candidate@example.com' },
    update: {
      password,
      role: 'JOB_SEEKER',
      status: 'ACTIVE',
      isVerified: true,
    },
    create: {
      email: 'candidate@example.com',
      password,
      role: 'JOB_SEEKER',
      status: 'ACTIVE',
      isVerified: true,
    },
  });

  const candidateProfile = await prisma.jobSeekerProfile.upsert({
    where: { userId: candidate.id },
    update: {
      fullName: 'Andre Williams',
      phone: '876-555-0102',
      location: 'Spanish Town, Jamaica',
      about: 'Frontend developer who enjoys making reliable, accessible products.',
      experienceLevel: 'Mid',
      skills: ['TypeScript', 'React', 'Node.js'],
      employmentType: ['FULL_TIME', 'REMOTE'],
      preferredJobCategories: { set: [{ id: technology.id }] },
    },
    create: {
      userId: candidate.id,
      fullName: 'Andre Williams',
      phone: '876-555-0102',
      location: 'Spanish Town, Jamaica',
      about: 'Frontend developer who enjoys making reliable, accessible products.',
      experienceLevel: 'Mid',
      skills: ['TypeScript', 'React', 'Node.js'],
      employmentType: ['FULL_TIME', 'REMOTE'],
      idCardFront: 'seed/demo-candidate-id-front.jpg',
      idCardBack: 'seed/demo-candidate-id-back.jpg',
      selfieImage: 'seed/demo-candidate-selfie.jpg',
      resumeUrl: 'seed/demo-resume.pdf',
      preferredJobCategories: { connect: [{ id: technology.id }] },
    },
  });

  await prisma.wallet.upsert({
    where: { jobSeekerId: candidateProfile.id },
    update: {},
    create: { jobSeekerId: candidateProfile.id, balance: '12500.00' },
  });

  const starterPlan = await upsertPlan({
    name: 'Starter',
    price: 2500,
    duration: 30,
    slotsAvailable: 3,
    features: ['3 active jobs', 'Candidate applications', 'Basic employer profile'],
  });

  await upsertPlan({
    name: 'Professional',
    price: 6000,
    duration: 90,
    slotsAvailable: 10,
    features: ['10 active jobs', 'Priority listings', 'Advanced employer profile'],
  });

  await prisma.employerSubscription.upsert({
    where: { employerId: employerProfile.id },
    update: { planId: starterPlan.id, expiryDate: new Date('2099-12-31T00:00:00.000Z') },
    create: {
      employerId: employerProfile.id,
      planId: starterPlan.id,
      expiryDate: new Date('2099-12-31T00:00:00.000Z'),
    },
  });

  const job = await prisma.job.upsert({
    where: { id: 'seed-frontend-developer' },
    update: {
      title: 'Frontend Developer',
      description: 'Build polished web experiences for Jamaican businesses and job seekers.',
      status: 'OPEN',
      categories: { set: [{ id: technology.id }] },
    },
    create: {
      id: 'seed-frontend-developer',
      employerId: employerProfile.id,
      title: 'Frontend Developer',
      description: 'Build polished web experiences for Jamaican businesses and job seekers.',
      location: 'Kingston, Jamaica',
      workTime: ['Monday-Friday', '8:30 AM-5:00 PM'],
      isRemote: true,
      salaryType: 'RANGE',
      salaryFrequency: 'MONTHLY',
      salaryAmount: '180000-240000',
      responsibilities: ['Build React interfaces', 'Collaborate with product and design', 'Review code'],
      benefits: ['Health coverage', 'Flexible hours', 'Professional development'],
      experienceLevel: 'Mid',
      minExperience: 2,
      educationLevel: "Bachelor's degree or equivalent experience",
      numberOfEmployees: 1,
      deadline: new Date('2099-12-31T00:00:00.000Z'),
      jobType: ['FULL_TIME', 'REMOTE'],
      categories: { connect: [{ id: technology.id }] },
    },
  });

  await prisma.application.upsert({
    where: { jobId_jobSeekerId: { jobId: job.id, jobSeekerId: candidateProfile.id } },
    update: { status: 'APPLIED', shortMessage: 'I would love to help build this product.' },
    create: {
      jobId: job.id,
      jobSeekerId: candidateProfile.id,
      status: 'APPLIED',
      shortMessage: 'I would love to help build this product.',
      workEligibilityConfirmed: true,
    },
  });

  await prisma.platformSetting.upsert({
    where: { key: 'platform_name' },
    update: { value: 'HireHub Jamaica' },
    create: { key: 'platform_name', value: 'HireHub Jamaica' },
  });

  console.log('Seed complete.');
  console.log('Demo password for all accounts:', demoPassword);
  console.log('Accounts: admin@example.com, employer@example.com, candidate@example.com');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
