export interface Repository {
  id: string;
  name: string;
  owner: string;
  description: string;
  matchScore: number;       // Cosine similarity % (Semantic Match)
  codeQuality: number;      // % for visualization
  documentation: number;    // % for visualization
  beginnerFriendliness: number; // % for visualization
  techStack: string[];
  stars: number;
  activity: 'Active' | 'Recently Updated' | 'Inactive';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  useCase: 'AI' | 'Web Dev' | 'IoT' | 'Cybersecurity' | 'Blockchain';
  language: 'Python' | 'JavaScript' | 'Java' | 'C++' | 'Go';
  githubUrl: string;
  aiExplanation: string;
  aiDetails: string[];
  // Per-repo AI Discovery Insights (from Groq LLM)
  aiInsight?: string;
  aiWhyItFits?: string;
  aiSuitability?: string;
  aiAdvantages?: string[];
  aiDisadvantages?: string[];
  aiBestUseCase?: string;
}

export const mockRepositories: Repository[] = [
  {
    id: 'fastapi-auth-starter',
    name: 'fastapi-secure-backend',
    owner: 'tiangolo-fan',
    description: 'A beginner-friendly, ready-to-run FastAPI boilerplate featuring secure JWT authentication, PostgreSQL connectivity via SQLModel, and fully automated Pytest test suites.',
    matchScore: 96,
    codeQuality: 92,
    documentation: 95,
    beginnerFriendliness: 98,
    techStack: ['FastAPI', 'Python', 'SQLModel', 'JWT', 'PostgreSQL', 'Pytest'],
    stars: 1420,
    activity: 'Active',
    difficulty: 'Beginner',
    useCase: 'Web Dev',
    language: 'Python',
    githubUrl: 'https://github.com/tiangolo/fastapi',
    aiExplanation: 'Perfect match for your search. It leverages FastAPI for rapid web development, comes pre-configured with industry-standard security features, and features beginner-focused, detailed tutorial walk-throughs in the README.',
    aiDetails: [
      'Uses FastAPI as its core web framework, enabling high performance and automatic interactive API docs.',
      'Includes a fully configured JWT token authentication and user management system.',
      'Extremely well-documented with clear onboarding instructions designed for beginners.',
      'Actively maintained with 100% test coverage using Pytest.',
      'Pre-configured with Docker Compose for seamless local PostgreSQL database spin-up.'
    ]
  },
  {
    id: 'react-glassmorphic-dashboard',
    name: 'glassmorphic-ui-kit',
    owner: 'creative-designer',
    description: 'An elegant React + Tailwind CSS dashboard template featuring modern glassmorphism panels, interactive charts, and a seamless toggleable Dark/Light mode theme system.',
    matchScore: 92,
    codeQuality: 89,
    documentation: 90,
    beginnerFriendliness: 94,
    techStack: ['React', 'Tailwind CSS', 'TypeScript', 'Recharts', 'Vite'],
    stars: 3250,
    activity: 'Recently Updated',
    difficulty: 'Beginner',
    useCase: 'Web Dev',
    language: 'JavaScript',
    githubUrl: 'https://github.com/facebook/react',
    aiExplanation: 'Exquisite modern dashboard implementing beautiful translucent layers and glassmorphic designs. It includes atomic Tailwind structures that are simple to customize.',
    aiDetails: [
      'Employs glassmorphic visual designs using pure Tailwind backdrop-blur filters.',
      'Pre-configured with atomic react components that are clean and easy for beginners to understand.',
      'Includes interactive dashboard analytics powered by Recharts.',
      'Supports fully responsive layouts out-of-the-box for mobile, tablet, and desktop screens.'
    ]
  },
  {
    id: 'ai-semantic-indexer',
    name: 'semantix-vector-search',
    owner: 'deep-mind-hacker',
    description: 'An advanced Python semantic search engine utilizing HuggingFace sentence-transformers and Qdrant database to index, search, and rank local document libraries based on conceptual meaning.',
    matchScore: 95,
    codeQuality: 91,
    documentation: 86,
    beginnerFriendliness: 78,
    techStack: ['Python', 'HuggingFace', 'SentenceTransformers', 'Qdrant', 'FastAPI'],
    stars: 890,
    activity: 'Active',
    difficulty: 'Intermediate',
    useCase: 'AI',
    language: 'Python',
    githubUrl: 'https://github.com/huggingface/transformers',
    aiExplanation: 'Highly advanced tool for semantic discovery. Excellent for developers wishing to implement custom RAG (Retrieval-Augmented Generation) pipelines and embeddings search.',
    aiDetails: [
      'Leverages modern SentenceTransformers embeddings to extract conceptual meaning from queries.',
      'Integrates with Qdrant vector database for ultra-fast cosine similarity rankings.',
      'Written in clean modular Python with pre-built FastAPI web routers.',
      'Includes automated scripts to download and cache local model weights offline.'
    ]
  },
  {
    id: 'rust-blockchain-node',
    name: 'aurora-ledger-core',
    owner: 'ether-forge',
    description: 'A high-performance, single-thread proof-of-authority blockchain node written in Rust, utilizing libp2p for peer discovery and sled for disk-based state storage.',
    matchScore: 88,
    codeQuality: 96,
    documentation: 88,
    beginnerFriendliness: 65,
    techStack: ['Rust', 'libp2p', 'sled', 'tokio', 'protobuf'],
    stars: 2110,
    activity: 'Active',
    difficulty: 'Advanced',
    useCase: 'Blockchain',
    language: 'Go', // Map to Go/C++ where appropriate or just have it. Wait, programming language filters are Python, JavaScript, Java, C++, Go. Let's make it C++ or Go! Let's make it C++
    githubUrl: 'https://github.com/bitcoin/bitcoin',
    aiExplanation: 'Incredibly detailed systems repository. Focuses heavily on network routing protocol correctness, asynchronous token transfers, and low-latency storage engines in Rust/C++.',
    aiDetails: [
      'High-performance consensus layer utilizing proof-of-authority voting blocks.',
      'Written in robust C++ utilizing asynchronous threads for ultra-low block times.',
      'Implements peer-to-peer Gossipsub routing protocols via libp2p structures.',
      'Includes rigorous unit testing and cryptographic stress tests to ensure memory safety.'
    ]
  },
  {
    id: 'cyber-vault-scanner',
    name: 'owasp-api-auditor',
    owner: 'sec-ops-defense',
    description: 'A Golang static analysis auditing CLI designed to scan codebase endpoints for common OWASP Top 10 API vulnerabilities, missing auth headers, and hardcoded secrets.',
    matchScore: 94,
    codeQuality: 93,
    documentation: 92,
    beginnerFriendliness: 82,
    techStack: ['Go', 'YAML', 'CLI', 'Security', 'Docker'],
    stars: 1780,
    activity: 'Active',
    difficulty: 'Intermediate',
    useCase: 'Cybersecurity',
    language: 'Go',
    githubUrl: 'https://github.com/golang/go',
    aiExplanation: 'A essential Go security utility. Scans routing controllers for insecure direct object references, cross-origin resource sharing leakage, and missing rate limiters.',
    aiDetails: [
      'Ultra-fast Golang binary that parses project directories in fractions of a second.',
      'Highly customizable rules written in clear YAML configuration patterns.',
      'Includes pre-configured GitHub Actions workflows for seamless CI/CD pipeline integration.',
      'Perfect for DevOps and security auditors seeking automated code compliance scanners.'
    ]
  },
  {
    id: 'iot-smart-irrigate',
    name: 'hydroflow-micro-node',
    owner: 'green-green-grass',
    description: 'An IoT firmware node codebase written in C++ for ESP32 microcontrollers, tracking soil humidity via capacitive sensors and triggering automated relays with MQTT feeds.',
    matchScore: 91,
    codeQuality: 87,
    documentation: 94,
    beginnerFriendliness: 88,
    techStack: ['C++', 'Arduino', 'ESP32', 'MQTT', 'FreeRTOS'],
    stars: 640,
    activity: 'Recently Updated',
    difficulty: 'Intermediate',
    useCase: 'IoT',
    language: 'C++',
    githubUrl: 'https://github.com/espressif/arduino-esp32',
    aiExplanation: 'Incredible micro-controller project. Seamlessly integrates physical humidity tracking with asynchronous FreeRTOS tasks and cloud-managed MQTT feeds.',
    aiDetails: [
      'Written in native C++ using the lightweight Arduino framework.',
      'Implements real-time sensor processing utilizing non-blocking FreeRTOS tasks.',
      'Features a beautiful local Wi-Fi captive portal configuration webpage for easy setup.',
      'Robust MQTT reconnection logic handling erratic outdoor connectivity.'
    ]
  },
  {
    id: 'java-enterprise-micro',
    name: 'spring-cloud-gateway',
    owner: 'corporate-devs',
    description: 'A enterprise-grade Java 17 microservices gateway built with Spring Boot, Spring Cloud, and Consul for service registration, load balancing, and rate limiting.',
    matchScore: 89,
    codeQuality: 94,
    documentation: 93,
    beginnerFriendliness: 70,
    techStack: ['Java', 'Spring Boot', 'Spring Cloud', 'Consul', 'Docker'],
    stars: 4300,
    activity: 'Active',
    difficulty: 'Advanced',
    useCase: 'Web Dev',
    language: 'Java',
    githubUrl: 'https://github.com/spring-projects/spring-boot',
    aiExplanation: 'Industry standard corporate microservice architecture. Well-suited for understanding enterprise service discovery, reactive routing pipelines, and distributed tracing.',
    aiDetails: [
      'Written in Java 17 leveraging reactive Spring WebFlux pipelines.',
      'Integrated with HashiCorp Consul for dynamic cloud configuration and service registration.',
      'Features automated resilience systems utilizing Resilience4j circuit breakers.',
      'Includes centralized log tracking configurations using Prometheus and Grafana dashboards.'
    ]
  }
];
