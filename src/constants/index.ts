// Application constants and configuration

export const ACHIEVEMENTS = [
  { id: 1, title: 'Primul Site Web', description: 'Ai creat primul tău site web!', icon: '🌐', unlocked: true, category: 'tech' as const },
  { id: 2, title: 'Artist Digital', description: 'Ai finalizat 10 lucrări digitale', icon: '🎨', unlocked: true, category: 'art' as const },
  { id: 3, title: 'Maestru al Bazelor de Date', description: 'Ai optimizat 5 query-uri complexe', icon: '🗄️', unlocked: true, category: 'tech' as const },
  { id: 4, title: 'Poet Modern', description: 'Ai scris 20 de poezii', icon: '📝', unlocked: true, category: 'creative' as const },
  { id: 5, title: 'Full-Stack Developer', description: 'Ai completat un proiect full-stack complex', icon: '💻', unlocked: false, category: 'tech' as const },
  { id: 6, title: 'Galerie de Artă', description: 'Ai expus 50 de lucrări artistice', icon: '🖼️', unlocked: false, category: 'art' as const },
  { id: 7, title: 'AI Pioneer', description: 'Ai implementat primul tău model ML', icon: '🤖', unlocked: false, category: 'tech' as const },
  { id: 8, title: 'Creative Master', description: 'Ai dominat toate domeniile creative', icon: '👑', unlocked: false, category: 'master' as const }
];

export const SKILLS = [
  { name: 'React & TypeScript', level: 85, category: 'Frontend' },
  { name: 'Node.js & Express', level: 75, category: 'Backend' },
  { name: 'Database Design', level: 80, category: 'Database' },
  { name: 'UI/UX Design', level: 90, category: 'Design' },
  { name: 'Adobe Creative Suite', level: 95, category: 'Design' },
  { name: 'Machine Learning', level: 60, category: 'AI' },
  { name: 'Photography', level: 85, category: 'Creative' },
  { name: 'Creative Writing', level: 90, category: 'Creative' }
];

export const PORTFOLIO_CATEGORIES = [
  // Tech Categories
  {
    id: 'web-development',
    title: 'Dezvoltare Web',
    description: 'Site-uri web, aplicații React și proiecte full-stack cu tehnologii moderne',
    category: 'tech' as const,
    projectCount: 12,
    route: '/web-dev'
  },
  {
    id: 'database-projects',
    title: 'Proiecte Baze de Date',
    description: 'Sisteme de management al datelor, optimizări și arhitecturi complexe',
    category: 'tech' as const,
    projectCount: 6,
    route: '/database'
  },
  {
    id: 'ai-ml-projects',
    title: 'AI & Machine Learning',
    description: 'Proiecte cu inteligență artificială, modele ML și experimente cu tehnologii AI',
    category: 'tech' as const,
    projectCount: 4,
    route: '/ai-ml'
  },
  {
    id: 'ui-ux-design',
    title: 'Design UI/UX',
    description: 'Interfețe de aplicații, prototipuri și experiențe utilizator inovatoare',
    category: 'tech' as const,
    projectCount: 8,
    route: '/ui-ux'
  },
  // Art Categories
  {
    id: 'digital-art',
    title: 'Artă Digitală',
    description: 'Postere, edituri, ilustrații și designuri creative realizate în Photoshop și Illustrator',
    category: 'art' as const,
    projectCount: 15,
    route: '/digital-art'
  },
  {
    id: 'photography',
    title: 'Fotografie',
    description: 'Fotografie artistică, editare foto și capturi creative din diverse domenii',
    category: 'art' as const,
    projectCount: 30,
    route: '/photography'
  },
  {
    id: 'traditional-art',
    title: 'Artă Tradițională',
    description: 'Desene pe foaie, picturi și creații artistice realizate cu instrumente tradiționale',
    category: 'art' as const,
    projectCount: 20,
    route: '/traditional-art'
  },
  {
    id: 'creative-writing',
    title: 'Scriere Creativă',
    description: 'Poezii, texte creative și alte forme de expresie literară',
    category: 'art' as const,
    projectCount: 25,
    route: '/writing'
  }
];

export const ADMIN_CREDENTIALS = {
  username: 'BicaMarius',
  password: 'PortofoliuDigitalMarius'
};

export const CONTACT_INFO = {
  name: 'Bica Marius Adrian',
  title: 'Creative Developer & Digital Artist',
  email: 'marius.bica@email.com',
  phone: '+40 123 456 789',
  location: 'România',
  socialMedia: {
    instagram: 'https://instagram.com/bicamarius',
    facebook: 'https://facebook.com/bicamarius',
    linkedin: 'https://linkedin.com/in/bicamarius',
    github: 'https://github.com/bicamarius'
  }
};

export const APP_CONFIG = {
  name: 'Creative Portfolio',
  version: '1.0.0',
  description: 'Digital Portfolio - Tech meets Art',
  author: 'Bica Marius Adrian'
};
