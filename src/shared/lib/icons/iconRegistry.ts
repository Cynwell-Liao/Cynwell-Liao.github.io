import { DiMsqlServer } from 'react-icons/di'
import { FaDatabase, FaDocker, FaJava } from 'react-icons/fa'
import { LuBookOpen, LuGraduationCap, LuLibrary } from 'react-icons/lu'
import {
  SiAmazonwebservices,
  SiDjango,
  SiDocker,
  SiDotnet,
  SiElasticsearch,
  SiFirebase,
  SiFlask,
  SiGooglecloud,
  SiGooglegemini,
  SiHtml5,
  SiHuggingface,
  SiJavascript,
  SiJunit5,
  SiKubernetes,
  SiLangchain,
  SiMongodb,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiOllama,
  SiOpentelemetry,
  SiPostgresql,
  SiPrometheus,
  SiPytest,
  SiPython,
  SiPytorch,
  SiRedis,
  SiSpringboot,
  SiTerraform,
  SiTypescript,
} from 'react-icons/si'
import { TbBrandCSharp } from 'react-icons/tb'
import { VscAzure } from 'react-icons/vsc'

import type { IconType } from 'react-icons'

/**
 * Flat registry mapping string keys to react-icons components.
 *
 * Content JSON files reference icons by these keys (e.g. `"icon": "java"`).
 * To add a new icon, install/import the component and add a single entry here.
 */
const iconRegistry: Record<string, IconType> = {
  // ── Languages ──
  java: FaJava,
  csharp: TbBrandCSharp,
  python: SiPython,
  typescript: SiTypescript,
  javascript: SiJavascript,
  sql: FaDatabase,
  html: SiHtml5,

  // ── Backend & Web Frameworks ──
  springboot: SiSpringboot,
  dotnet: SiDotnet,
  django: SiDjango,
  flask: SiFlask,
  nodejs: SiNodedotjs,
  nextjs: SiNextdotjs,

  // ── ML & AI ──
  gemini: SiGooglegemini,
  ollama: SiOllama,
  langchain: SiLangchain,
  huggingface: SiHuggingface,
  pytorch: SiPytorch,

  // ── Testing & Observability ──
  opentelemetry: SiOpentelemetry,
  prometheus: SiPrometheus,
  junit: SiJunit5,
  pytest: SiPytest,

  // ── Cloud & Kubernetes ──
  gcp: SiGooglecloud,
  aws: SiAmazonwebservices,
  azure: VscAzure,
  docker: SiDocker,
  'docker-alt': FaDocker,
  kubernetes: SiKubernetes,
  terraform: SiTerraform,

  // ── Databases ──
  postgresql: SiPostgresql,
  mysql: SiMysql,
  mssql: DiMsqlServer,
  firestore: SiFirebase,
  mongodb: SiMongodb,
  redis: SiRedis,
  elasticsearch: SiElasticsearch,

  // ── Education ──
  library: LuLibrary,
  'book-open': LuBookOpen,
  'graduation-cap': LuGraduationCap,
}

export const resolveIcon = (key: string | undefined): IconType | undefined =>
  key ? iconRegistry[key] : undefined
