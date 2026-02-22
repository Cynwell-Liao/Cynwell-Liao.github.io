import { DiMsqlServer } from 'react-icons/di'
import { FaJava, FaDatabase, FaDocker } from 'react-icons/fa'
import { LuGraduationCap, LuLibrary, LuBookOpen } from 'react-icons/lu'
import {
  SiAmazonwebservices,
  SiPostgresql,
  SiTerraform,
  SiTypescript,
  SiSpringboot,
  SiDjango,
  SiGooglecloud,
  SiMysql,
  SiPython,
  SiRedis,
  SiNextdotjs,
  SiGooglegemini,
  SiElasticsearch,
  SiJunit5,
  SiFlask,
  SiOllama,
  SiKubernetes,
  SiGithubactions,
  SiNodedotjs,
  SiFirebase,
  SiJavascript,
  SiHtml5,
  SiLangchain,
  SiDocker,
  SiPytorch,
  SiHuggingface,
  SiOpentelemetry,
  SiPrometheus,
  SiPytest,
} from 'react-icons/si'

import type {
  EducationItem,
  NavLink,
  ProfileData,
  SkillCategory,
} from '@shared/types/portfolio.types'

export const profile: ProfileData = {
  name: 'Cynwell Liao',
  title: 'Software Engineer',
  tagline:
    'Building production backend systems and event-driven RAG pipelines with reliability, velocity, and observability.',
  about: [
    'I am a Graduate/Junior Software Engineer based in Melbourne, currently completing a Master of Information Technology (expected Aug 2026).',
    'I have built and shipped production backend systems and event-driven pipelines, handling webhooks, queues/outbox patterns, retries, and comprehensive observability.',
    'My core technical strengths include Java/Spring Boot, Python/Django, and TypeScript/Node.js, complemented by extensive cloud infrastructure automation (GCP, AWS) via Docker and CI/CD.',
    'I am deeply interested in backend roles and LLM-enabled systems where application reliability, scalability, and high performance are critical.',
  ],
  githubUsername: 'Cynwell-Liao',
  githubUrl: 'https://github.com/Cynwell-Liao',
  resumePath: '/resume.pdf',
}

export const navLinks: NavLink[] = [
  { label: 'About', href: '#about' },
  { label: 'Tech Stack', href: '#tech-stack' },
  { label: 'Projects', href: '#projects' },
  { label: 'Education', href: '#education' },
]

export const education: EducationItem[] = [
  {
    institution: 'The University of Melbourne',
    location: 'Melbourne, VIC, Australia',
    degree: 'Master of Information Technology (Computing)',
    duration: 'Jul. 2024 \u2014 Aug. 2026',
    achievements: [
      'Mobile Computing Systems Programming \u2014 ParkPie (Best Project of the Year, formally commended by Prof. Vassilis Kostakos for Outstanding Idea and Implementation)',
      'Led cross-functional teams in 2025 FEIT Hackathon (zoomies, Finalists) and 2024 FEIT Hackathon (levelfield.ai, Finalists), coordinating task delegation, design decisions, and demos under 3-day deadlines',
    ],
    icon: LuLibrary,
    logoUrl: 'https://www.google.com/s2/favicons?sz=256&domain=unimelb.edu.au',
    color: '#094183', // Unimelb Blue
  },
  {
    institution: 'Harvard University',
    location: 'Cambridge, MA, USA',
    degree: 'Short-term Exchange, Project Management',
    duration: 'Jul. 2025 \u2014 Aug. 2025',
    achievements: [
      'Awarded Engineering Exchange Scholarship issued by FEIT, University of Melbourne',
    ],
    icon: LuBookOpen,
    logoUrl: 'https://www.google.com/s2/favicons?sz=256&domain=harvard.edu',
    color: '#A51C30', // Harvard Crimson
  },
  {
    institution: 'Queensland University of Technology (QUT)',
    location: 'Brisbane, QLD, Australia',
    degree: 'Bachelor of Business (International Business)',
    duration: 'Jul. 2020 \u2014 Aug. 2024',
    achievements: [
      "QUT Executive Dean's Commendation for Academic Excellence issued by Executive Dean, Jul. 2024",
      'Recipient of Ministry of Education (Taiwan) Study Abroad Scholarship',
      "Dual bachelor's degree program with Bachelor of Business Administration at FCU (GPA 4.0)",
    ],
    icon: LuGraduationCap,
    logoUrl: 'https://www.google.com/s2/favicons?sz=256&domain=qut.edu.au',
    color: '#003C71', // QUT Blue
  },
]

export const skillCategories: SkillCategory[] = [
  {
    title: 'Languages',
    items: [
      {
        name: 'Java',
        note: 'Enterprise JVM applications',
        icon: FaJava,
        color: '#ED8B00',
      },
      {
        name: 'Python',
        note: 'Data pipelines & ML scripting',
        icon: SiPython,
        color: '#3776AB',
      },
      {
        name: 'TypeScript',
        note: 'Typed full-stack environments',
        icon: SiTypescript,
        color: '#3178C6',
      },
      {
        name: 'JavaScript',
        note: 'Dynamic web scripting',
        icon: SiJavascript,
        color: '#F7DF1E',
      },
      {
        name: 'SQL',
        note: 'Database query language',
        icon: FaDatabase,
        color: '#4479A1',
      },
      {
        name: 'HTML',
        note: 'Web page building blocks',
        icon: SiHtml5,
        color: '#E34F26',
      },
    ],
  },
  {
    title: 'Backend & Web Frameworks',
    items: [
      {
        name: 'Spring Boot',
        note: 'Robust APIs & microservices',
        icon: SiSpringboot,
        color: '#6DB33F',
      },
      { name: 'Django', note: 'Python web scaffolding', icon: SiDjango },
      { name: 'Flask', note: 'Micro web framework', icon: SiFlask },
      {
        name: 'Node.js',
        note: 'Server-side runtimes',
        icon: SiNodedotjs,
        color: '#339939',
      },
      { name: 'Next.js', note: 'React meta-framework', icon: SiNextdotjs },
    ],
  },
  {
    title: 'ML & AI',
    items: [
      {
        name: 'Gemini',
        note: 'Cloud LLM APIs',
        icon: SiGooglegemini,
        color: '#8E75B2',
      },
      { name: 'Ollama', note: 'Local LLM APIs', icon: SiOllama },
      { name: 'LangChain', note: 'Agentic orchestration', icon: SiLangchain },
      {
        name: 'Transformers',
        note: 'Hugging Face models',
        icon: SiHuggingface,
        color: '#FFD21E',
      },
      {
        name: 'PyTorch',
        note: 'Deep learning framework',
        icon: SiPytorch,
        color: '#EE4C2C',
      },
    ],
  },
  {
    title: 'Testing & Observability',
    items: [
      { name: 'LangSmith', note: 'LLM evaluation and tracing', icon: SiLangchain },
      {
        name: 'OpenTelemetry',
        note: 'Distributed tracing system',
        icon: SiOpentelemetry,
      },
      {
        name: 'Prometheus',
        note: 'Metrics reporting & Micrometer',
        icon: SiPrometheus,
        color: '#E6522C',
      },
      {
        name: 'JUnit',
        note: 'Java testing framework',
        icon: SiJunit5,
        color: '#25A162',
      },
      {
        name: 'Pytest',
        note: 'Python testing framework',
        icon: SiPytest,
        color: '#0A9EDC',
      },
      {
        name: 'Testcontainers',
        note: 'Integration testing',
        icon: FaDocker,
        color: '#2496ED',
      },
    ],
  },
  {
    title: 'Cloud & Kubernetes',
    items: [
      {
        name: 'Google Cloud Platform',
        note: 'Cloud Run, Pub/Sub, Storage',
        icon: SiGooglecloud,
        color: '#4285F4',
      },
      {
        name: 'AWS',
        note: 'EC2, RDS, S3, Lambda',
        icon: SiAmazonwebservices,
        color: '#FF9900',
      },
      { name: 'Docker', note: 'Containerization', icon: SiDocker, color: '#2496ED' },
      {
        name: 'Kubernetes',
        note: 'Container orchestration',
        icon: SiKubernetes,
        color: '#326CE5',
      },
      {
        name: 'Terraform',
        note: 'Infrastructure-as-Code',
        icon: SiTerraform,
        color: '#844FBA',
      },
      {
        name: 'GitHub Actions',
        note: 'CI/CD pipelines',
        icon: SiGithubactions,
        color: '#2088FF',
      },
    ],
  },
  {
    title: 'Databases',
    items: [
      {
        name: 'PostgreSQL',
        note: 'Relational, pgvector, PostGIS',
        icon: SiPostgresql,
        color: '#336791',
      },
      { name: 'MySQL', note: 'Relational databases', icon: SiMysql, color: '#4479A1' },
      {
        name: 'Microsoft SQL Server',
        note: 'Relational databases',
        icon: DiMsqlServer,
        color: '#CC292B',
      },
      {
        name: 'Firestore',
        note: 'NoSQL document datastore',
        icon: SiFirebase,
        color: '#FFCA28',
      },
      { name: 'Redis', note: 'In-memory caching', icon: SiRedis, color: '#DC382D' },
      {
        name: 'Elasticsearch',
        note: 'High-performance search',
        icon: SiElasticsearch,
        color: '#005571',
      },
    ],
  },
]
