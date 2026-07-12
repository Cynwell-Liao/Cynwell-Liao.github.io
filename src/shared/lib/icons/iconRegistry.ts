import { DiMsqlServer } from 'react-icons/di'
import { FaAws, FaDatabase, FaDocker, FaJava } from 'react-icons/fa'
import { LuBookOpen, LuGraduationCap, LuLibrary } from 'react-icons/lu'
import {
  SiClaude,
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
import { TbBrandCSharp, TbBrandGolang, TbBrandOpenai } from 'react-icons/tb'
import { VscAzure } from 'react-icons/vsc'

import type { IconKey } from './iconKeys'
import type { IconType } from 'react-icons'

/**
 * Flat registry mapping string keys to react-icons components.
 *
 * Content JSON files reference icons by these keys (e.g. `"icon": "java"`).
 * Add new public keys to `iconKeys.ts`, then map the matching component here.
 */
const iconRegistry = {
  // ── Languages ──
  java: FaJava,
  csharp: TbBrandCSharp,
  go: TbBrandGolang,
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
  claude: SiClaude,
  gemini: SiGooglegemini,
  ollama: SiOllama,
  openai: TbBrandOpenai,
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
  aws: FaAws,
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
} satisfies Record<IconKey, IconType>

export const resolveIcon = (key: IconKey | undefined): IconType | undefined =>
  key ? iconRegistry[key] : undefined
