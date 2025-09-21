import React, { useState } from 'react';
import { 
  User, 
  Trophy, 
  Heart, 
  Award, 
  FileText, 
  BarChart3,
  Download,
  Lock,
  Unlock,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/contexts/AdminContext';

// Mock data pentru achievements
const achievements = [
  { id: 1, title: 'Primul Site Web', description: 'Ai creat primul tău site web!', icon: '🌐', unlocked: true, category: 'tech' },
  { id: 2, title: 'Artist Digital', description: 'Ai finalizat 10 lucrări digitale', icon: '🎨', unlocked: true, category: 'art' },
  { id: 3, title: 'Maestru al Bazelor de Date', description: 'Ai optimizat 5 query-uri complexe', icon: '🗄️', unlocked: true, category: 'tech' },
  { id: 4, title: 'Poet Modern', description: 'Ai scris 20 de poezii', icon: '📝', unlocked: true, category: 'creative' },
  { id: 5, title: 'Full-Stack Developer', description: 'Ai completat un proiect full-stack complex', icon: '💻', unlocked: false, category: 'tech' },
  { id: 6, title: 'Galerie de Artă', description: 'Ai expus 50 de lucrări artistice', icon: '🖼️', unlocked: false, category: 'art' },
  { id: 7, title: 'AI Pioneer', description: 'Ai implementat primul tău model ML', icon: '🤖', unlocked: false, category: 'tech' },
  { id: 8, title: 'Creative Master', description: 'Ai dominat toate domeniile creative', icon: '👑', unlocked: false, category: 'master' }
];

const skills = [
  { name: 'React & TypeScript', level: 85, category: 'Frontend' },
  { name: 'Node.js & Express', level: 75, category: 'Backend' },
  { name: 'Database Design', level: 80, category: 'Database' },
  { name: 'UI/UX Design', level: 90, category: 'Design' },
  { name: 'Adobe Creative Suite', level: 95, category: 'Design' },
  { name: 'Machine Learning', level: 60, category: 'AI' },
  { name: 'Photography', level: 85, category: 'Creative' },
  { name: 'Creative Writing', level: 90, category: 'Creative' }
];

const Profile: React.FC = () => {
  const [showPrivateAchievements, setShowPrivateAchievements] = useState(false);
  const { isAdmin } = useAdmin();
  
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  const getAchievementColor = (category: string) => {
    switch (category) {
      case 'tech': return 'bg-tech-primary/20 text-tech-primary border-tech-primary/30';
      case 'art': return 'bg-art-primary/20 text-art-primary border-art-primary/30';
      case 'creative': return 'bg-secondary/20 text-secondary border-secondary/30';
      case 'master': return 'bg-achievement-gold/20 text-achievement-gold border-achievement-gold/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-hero flex items-center justify-center text-6xl">
              👨‍💻
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-4">
              Creative Developer & Artist
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Pasionat de tehnologie și artă, combin creativitatea cu inovația tehnică 
              pentru a crea experiențe digitale remarcabile.
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="cv" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
              <TabsTrigger value="cv">CV</TabsTrigger>
              {isAdmin && <TabsTrigger value="achievements">Achievements</TabsTrigger>}
              <TabsTrigger value="about">Despre Mine</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="certifications">Certificări</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            {/* CV Tab */}
            <TabsContent value="cv" className="space-y-6">
              <Card className="p-8 hover-lift">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-semibold">Curriculum Vitae</h2>
                  </div>
                  <Button variant="outline" className="hover:bg-primary/10">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-8 min-h-96 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Aici va fi încorporat PDF-ul cu CV-ul tău interactiv
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Cu zoom, scroll și opțiuni de download
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Achievements Tab */}
            {isAdmin && (
              <TabsContent value="achievements" className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-achievement-gold" />
                    <h2 className="text-2xl font-semibold">Personal Achievements</h2>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPrivateAchievements(!showPrivateAchievements)}
                    className="hover:bg-primary/10"
                  >
                    {showPrivateAchievements ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                    {showPrivateAchievements ? 'Ascunde Private' : 'Arată Private'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {achievements.map((achievement, index) => (
                    <Card
                      key={achievement.id}
                      className={`
                        p-6 transition-all duration-300 hover-lift
                        ${achievement.unlocked 
                          ? 'achievement-unlocked' 
                          : 'achievement-locked'
                        }
                        ${!achievement.unlocked && !showPrivateAchievements ? 'hidden' : ''}
                      `}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-4">{achievement.icon}</div>
                        <h3 className="font-semibold mb-2">{achievement.title}</h3>
                        <p className="text-sm opacity-80 mb-4">{achievement.description}</p>
                        <Badge className={getAchievementColor(achievement.category)}>
                          {achievement.category}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="text-center text-muted-foreground">
                  <Trophy className="h-8 w-8 mx-auto mb-2 text-achievement-gold" />
                  <p>
                    {unlockedAchievements.length} din {achievements.length} achievements deblocate
                  </p>
                </div>
              </TabsContent>
            )}

            {/* About Tab */}
            <TabsContent value="about" className="space-y-6">
              <Card className="p-8 hover-lift">
                <div className="flex items-center gap-3 mb-6">
                  <User className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Despre Mine</h2>
                </div>
                
                <div className="prose prose-invert max-w-none">
                  <p className="text-lg leading-relaxed mb-6">
                    Sunt o persoană care găsește frumusețea în intersecția dintre tehnologie și artă. 
                    Cu o pasiune pentru inovație și creativitate, îmi place să explorez limitele 
                    a ceea ce este posibil în domeniul digital și artistic.
                  </p>
                  
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-art-primary" />
                    Pasiunile Mele
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-tech-primary">Tehnologie</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Dezvoltare web modernă</li>
                        <li>• Inteligență artificială</li>
                        <li>• Design de baze de date</li>
                        <li>• Optimizare performanță</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-art-primary">Artă & Creativitate</h4>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Grafică digitală</li>
                        <li>• Fotografie artistică</li>
                        <li>• Scriere creativă</li>
                        <li>• Design UI/UX</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-6">
              <Card className="p-8 hover-lift">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Skills & Competențe</h2>
                </div>
                
                <div className="space-y-6">
                  {skills.map((skill, index) => (
                    <div key={skill.name} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{skill.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{skill.category}</Badge>
                          <span className="text-sm text-muted-foreground">{skill.level}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-gradient-hero h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Portfolio Statistics */}
              <Card className="p-8 hover-lift">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="h-6 w-6 text-achievement-gold" />
                  <h2 className="text-2xl font-semibold">Statistici Portfolio</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="p-6 text-center hover-lift bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-0">
                      <div className="text-3xl font-bold text-primary mb-2">156</div>
                      <div className="text-sm text-muted-foreground">Proiecte Totale</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-6 text-center hover-lift bg-gradient-to-br from-gaming-accent/10 to-gaming-accent/5 border-gaming-accent/20">
                    <CardContent className="p-0">
                      <div className="text-3xl font-bold text-gaming-accent mb-2">2.5k</div>
                      <div className="text-sm text-muted-foreground">Vizualizări</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-6 text-center hover-lift bg-gradient-to-br from-achievement-gold/10 to-achievement-gold/5 border-achievement-gold/20">
                    <CardContent className="p-0">
                      <div className="text-3xl font-bold text-achievement-gold mb-2">23</div>
                      <div className="text-sm text-muted-foreground">Achievements</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="p-6 text-center hover-lift bg-gradient-to-br from-art-primary/10 to-art-primary/5 border-art-primary/20">
                    <CardContent className="p-0">
                      <div className="text-3xl font-bold text-art-primary mb-2">4.2</div>
                      <div className="text-sm text-muted-foreground">Rating Mediu</div>
                    </CardContent>
                  </Card>
                </div>
              </Card>
            </TabsContent>

            {/* Certifications Tab */}
            <TabsContent value="certifications" className="space-y-6">
              <Card className="p-8 hover-lift">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="h-6 w-6 text-achievement-gold" />
                  <h2 className="text-2xl font-semibold">Certificări</h2>
                </div>
                
                <div className="text-center py-16">
                  <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aici vor fi afișate certificările tale într-un grid frumos
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cartonașe interactive cu detalii și verificare
                  </p>
                </div>
              </Card>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Informații de Contact</h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-gradient-to-br from-primary/5 to-gaming-accent/5 hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-gaming-accent to-achievement-gold rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-xl">MB</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">Bica Marius Adrian</h3>
                        <p className="text-muted-foreground">Creative Developer & Digital Artist</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gaming-accent" />
                        <span>marius.bica@email.com</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gaming-accent" />
                        <span>+40 123 456 789</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-gaming-accent" />
                        <span>România</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="hover-lift">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Despre Mine</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      Sunt un dezvoltator creativ pasionat de tehnologie și artă. 
                      Combin cunoștințele tehnice cu viziunea artistică pentru a crea 
                      experiențe digitale unice și memorabile. Mereu în căutarea 
                      provocărilor noi și a oportunităților de învățare.
                    </p>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Social Media</h4>
                      <div className="flex gap-3">
                        <a
                          href="https://instagram.com/bicamarius"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 transition-all duration-300"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        </a>
                        <a
                          href="https://linkedin.com/in/bicamarius"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 transition-all duration-300"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Stats Tab - Removed as it's now integrated into Skills */}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;