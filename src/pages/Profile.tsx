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
  Unlock
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-8">
              <TabsTrigger value="cv">CV</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="about">Despre Mine</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="certifications">Certificări</TabsTrigger>
              <TabsTrigger value="stats">Statistici</TabsTrigger>
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
            <TabsContent value="achievements" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-achievement-gold" />
                  <h2 className="text-2xl font-semibold">Gaming Achievements</h2>
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

            {/* Stats Tab */}
            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 text-center hover-lift">
                  <div className="text-3xl font-bold gradient-text mb-2">47</div>
                  <div className="text-sm text-muted-foreground">Proiecte Completate</div>
                </Card>
                <Card className="p-6 text-center hover-lift">
                  <div className="text-3xl font-bold text-tech-primary mb-2">12</div>
                  <div className="text-sm text-muted-foreground">Tehnologii Stăpânite</div>
                </Card>
                <Card className="p-6 text-center hover-lift">
                  <div className="text-3xl font-bold text-art-primary mb-2">85</div>
                  <div className="text-sm text-muted-foreground">Lucrări Artistice</div>
                </Card>
                <Card className="p-6 text-center hover-lift">
                  <div className="text-3xl font-bold text-achievement-gold mb-2">6</div>
                  <div className="text-sm text-muted-foreground">Achievements Deblocate</div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;