import {
  SiAmazonwebservices,
  SiDocker,
  SiGithubactions,
  SiKubernetes,
  SiPostgresql,
  SiReact,
  SiTerraform,
  SiTypescript,
  SiSpringboot,
  SiDjango,
  SiGooglecloud,
  SiNodedotjs,
} from 'react-icons/si'
import type { NavLink, ProfileData, SkillCategory } from '../types/portfolio'

export const profile: ProfileData = {
  name: 'Cynwell Liao',
  title: 'Software Engineer',
  tagline:
    'Building production backend systems and event-driven RAG pipelines with reliability, velocity, and observability.',
  about: [
    'I am a Graduate/Junior Software Engineer based in Melbourne, Australia, actively working at the intersection of backend architecture and AI engineering.',
    'My work spans full-stack implementation, event-driven pipelines (webhooks, queues/outbox), scalable cloud architecture (GCP, AWS), and LLM-enabled systems.',
  ],
  githubUsername: 'Cynwell-Liao',
  githubUrl: 'https://github.com/Cynwell-Liao',
  resumePath: '/resume.pdf',
}

export const navLinks: NavLink[] = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Tech Stack', href: '#tech-stack' },
  { label: 'Resume', href: '#resume' },
]

export const skillCategories: SkillCategory[] = [
  {
    title: 'Languages & Frameworks',
    items: [
      { name: 'Java & Spring Boot', note: 'Robust APIs and microservices', icon: SiSpringboot },
      { name: 'Python & Django', note: 'Data pipelines and AI integration', icon: SiDjango },
      { name: 'TypeScript & Next.js', note: 'High-performance full-stack apps', icon: SiTypescript },
      { name: 'Node.js', note: 'Server-side application logic', icon: SiNodedotjs },
    ],
  },
  {
    title: 'Cloud & Infrastructure',
    items: [
      { name: 'Google Cloud Platform', note: 'Cloud Run, Pub/Sub, Cloud Storage', icon: SiGooglecloud },
      { name: 'AWS', note: 'EC2, RDS, S3, Lambda', icon: SiAmazonwebservices },
      { name: 'Terraform', note: 'Verifiable Infrastructure-as-Code', icon: SiTerraform },
      { name: 'Docker', note: 'Reproducible build pipelines', icon: SiDocker },
    ],
  },
  {
    title: 'Data & Observability',
    items: [
      { name: 'PostgreSQL & pgvector', note: 'Relational & vector datastores', icon: SiPostgresql },
      { name: 'GitHub Actions', note: 'CI/CD and automation workflows', icon: SiGithubactions },
      { name: 'Kubernetes', note: 'Container orchestration at scale', icon: SiKubernetes },
      { name: 'React & Tailwind', note: 'Scalable interface engineering', icon: SiReact },
    ],
  },
]
