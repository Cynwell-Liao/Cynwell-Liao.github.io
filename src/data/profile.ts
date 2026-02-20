import {
  SiAmazonwebservices,
  SiDocker,
  SiGithubactions,
  SiKubernetes,
  SiPostgresql,
  SiPytorch,
  SiPython,
  SiReact,
  SiTailwindcss,
  SiTerraform,
  SiTypescript,
  SiFramer,
} from 'react-icons/si'
import type { NavLink, ProfileData, SkillCategory } from '../types/portfolio'

export const profile: ProfileData = {
  name: 'Cynwell Liao',
  title: 'AI & Cloud Engineer',
  tagline:
    'Designing resilient AI products and cloud platforms with reliability, velocity, and clean developer experience.',
  about: [
    'I focus on production-grade AI systems where model quality, observability, and platform reliability matter as much as shipping speed.',
    'My work spans cloud architecture, infrastructure automation, and developer tooling so teams can deliver AI features with lower risk.',
  ],
  githubUsername: 'Cynwell-Liao',
  githubUrl: 'https://github.com/Cynwell-Liao',
  resumePath: '/resume.pdf',
  stats: [
    { label: 'Production AI Projects', value: '12+' },
    { label: 'Cloud Regions Deployed', value: '9' },
    { label: 'Automation Coverage', value: '93%' },
  ],
}

export const navLinks: NavLink[] = [
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Tech Stack', href: '#tech-stack' },
  { label: 'Resume', href: '#resume' },
]

export const skillCategories: SkillCategory[] = [
  {
    title: 'Cloud Platform',
    items: [
      { name: 'AWS', note: 'Multi-account platform design', icon: SiAmazonwebservices },
      { name: 'Kubernetes', note: 'Container orchestration at scale', icon: SiKubernetes },
      { name: 'Terraform', note: 'Reusable infrastructure modules', icon: SiTerraform },
      { name: 'Docker', note: 'Reproducible build pipelines', icon: SiDocker },
    ],
  },
  {
    title: 'AI & Data',
    items: [
      { name: 'PyTorch', note: 'Model training and optimization', icon: SiPytorch },
      { name: 'Python', note: 'Data pipelines and API tooling', icon: SiPython },
      { name: 'PostgreSQL', note: 'Analytical and operational data', icon: SiPostgresql },
      { name: 'GitHub Actions', note: 'CI/CD and automation workflows', icon: SiGithubactions },
    ],
  },
  {
    title: 'Frontend & Product',
    items: [
      { name: 'TypeScript', note: 'Strongly typed application layers', icon: SiTypescript },
      { name: 'React', note: 'Accessible interface engineering', icon: SiReact },
      { name: 'Tailwind CSS', note: 'Scalable design system delivery', icon: SiTailwindcss },
      { name: 'Framer Motion', note: 'Meaningful motion and transitions', icon: SiFramer },
    ],
  },
]
