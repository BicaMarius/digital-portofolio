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
  MapPin,
  Upload,
  Trash2
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { PDFViewer } from '@/components/PDFViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/contexts/AdminContext';
import { useData } from '@/contexts/DataContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ACHIEVEMENTS, SKILLS, CONTACT_INFO } from '@/constants';

const Profile: React.FC = () => {
  const [showPrivateAchievements, setShowPrivateAchievements] = useState(false);
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  const { cvData, uploadNewCV, deleteExistingCV, getProjectCountByCategory, getTotalProjectCountByCategory } = useData();
  const [pendingCV, setPendingCV] = useState<{ fileName: string; fileUrl: string } | null>(null);
  
  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.unlocked);
  const lockedAchievements = ACHIEVEMENTS.filter(a => !a.unlocked);

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
      
      <div className={`${isMobile ? 'pt-20 pb-12 px-4' : 'responsive-hero responsive-padding'}`}>
        <div className={`${isMobile ? 'w-full' : 'responsive-container max-w-6xl'}`}>
          {/* Profile Header */}
          <div className={`text-center ${isMobile ? 'mb-8' : 'mb-12'} animate-fade-in`}>
            <div className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} mx-auto mb-6 rounded-full bg-gradient-hero flex items-center justify-center ${isMobile ? 'text-4xl' : 'text-6xl'}`}>
              👨‍💻
            </div>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold gradient-text mb-4`}>
              Creative Developer & Artist
            </h1>
            <p className={`${isMobile ? 'text-base' : 'text-xl'} text-muted-foreground max-w-2xl mx-auto`}>
              Pasionat de tehnologie și artă, combin creativitatea cu inovația tehnică 
              pentru a crea experiențe digitale remarcabile.
            </p>
          </div>

          {/* Tabs Navigation */}
          <Tabs defaultValue="cv" className="w-full">
            <TabsList className={`${isMobile ? 'flex flex-wrap gap-1 h-auto p-1 bg-muted/50' : 'responsive-tabs'} w-full mb-8`}>
              <TabsTrigger value="cv" className={isMobile ? 'flex-1 min-w-[80px] text-xs py-2' : ''}>CV</TabsTrigger>
              {isAdmin && <TabsTrigger value="achievements" className={isMobile ? 'flex-1 min-w-[80px] text-xs py-2' : ''}>Achievements</TabsTrigger>}
              <TabsTrigger value="about" className={isMobile ? 'flex-1 min-w-[80px] text-xs py-2' : ''}>Despre</TabsTrigger>
              <TabsTrigger value="skills" className={isMobile ? 'flex-1 min-w-[80px] text-xs py-2' : ''}>Skills</TabsTrigger>
              <TabsTrigger value="contact" className={isMobile ? 'flex-1 min-w-[80px] text-xs py-2' : ''}>Contact</TabsTrigger>
            </TabsList>

            {/* CV Tab */}
            <TabsContent value="cv" className="space-y-6">
              <Card className={`${isMobile ? 'p-4' : 'p-8'} hover-lift`}>
                <div className={`flex items-center ${isMobile ? 'flex-col gap-4' : 'justify-between'} mb-6`}>
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold`}>Curriculum Vitae</h2>
                  </div>
                  <div className={`flex items-center gap-2 ${isMobile ? 'flex-wrap justify-center' : ''}`}>
                    {cvData && (
                      <Button variant="outline" className="hover:bg-primary/10" size={isMobile ? 'sm' : 'default'}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    )}
                    {isAdmin && (
                      <>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const fileUrl = URL.createObjectURL(file);
                              setPendingCV({ fileName: file.name, fileUrl });
                            }
                          }}
                          className="hidden"
                          id="cv-upload"
                        />
                        <Button variant="outline" asChild>
                          <label htmlFor="cv-upload" className="cursor-pointer">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload CV
                          </label>
                        </Button>

                        {pendingCV && (
                          <div className="flex items-center gap-2">
                            <Button onClick={() => {
                              // finalize upload
                              uploadNewCV(pendingCV.fileName, pendingCV.fileUrl);
                              setPendingCV(null);
                            }}>
                              Gata
                            </Button>
                            <Button variant="outline" onClick={() => setPendingCV(null)}>
                              Anulează
                            </Button>
                          </div>
                        )}

                        {cvData && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              if (confirm('Sigur vrei să ștergi CV-ul?')) {
                                deleteExistingCV();
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {cvData ? (
                  <div className="bg-muted/30 rounded-lg overflow-hidden">
                    <div className="text-center p-4 border-b border-border/50">
                      <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                      <h3 className="text-lg font-semibold mb-1">{cvData.fileName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Uploadat pe: {cvData.uploadedAt.toLocaleDateString('ro-RO')}
                      </p>
                    </div>
                    <div className="min-h-[600px]">
                      <PDFViewer fileUrl={cvData.fileUrl} fileName={cvData.fileName} />
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-lg p-8 min-h-96 flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {isAdmin ? 'Nu ai încărcat un CV. Folosește butonul Upload CV pentru a adăuga unul.' : 'CV-ul nu este disponibil momentan.'}
                      </p>
                    </div>
                  </div>
                )}
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

                <div className="responsive-card-grid">
                  {ACHIEVEMENTS.map((achievement, index) => (
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
                    {unlockedAchievements.length} din {ACHIEVEMENTS.length} achievements deblocate
                  </p>
                </div>
              </TabsContent>
            )}

            {/* About Tab */}
            <TabsContent value="about" className="space-y-6">
              <Card className={`${isMobile ? 'p-4' : 'p-8'} hover-lift`}>
                <div className="flex items-center gap-3 mb-6">
                  <User className="h-6 w-6 text-primary" />
                  <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold`}>Despre Mine</h2>
                </div>
                
                <div className="prose prose-invert max-w-none">
                  <p className={`${isMobile ? 'text-base' : 'text-lg'} leading-relaxed mb-6`}>
                    Sunt o persoană care găsește frumusețea în intersecția dintre tehnologie și artă. 
                    Cu o pasiune pentru inovație și creativitate, îmi place să explorez limitele 
                    a ceea ce este posibil în domeniul digital și artistic.
                  </p>
                  
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold mb-4 flex items-center gap-2`}>
                    <Heart className="h-5 w-5 text-art-primary" />
                    Pasiunile Mele
                  </h3>
                  
                  <div className={`grid grid-cols-1 ${isMobile ? '' : 'md:grid-cols-2'} gap-6`}>
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

            {/* Skills & Statistics Tab */}
            <TabsContent value="skills" className="space-y-6">
              <Card className={`${isMobile ? 'p-4' : 'p-8'} hover-lift`}>
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold`}>Skills & Competențe</h2>
                </div>
                
                <div className="space-y-6">
                  {SKILLS.map((skill, index) => (
                    <div key={skill.name} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                      <div className={`flex ${isMobile ? 'flex-col gap-1' : 'justify-between items-center'} mb-2`}>
                        <span className="font-medium">{skill.name}</span>
                        <div className={`flex items-center gap-2 ${isMobile ? 'justify-between' : ''}`}>
                          <Badge variant="outline" className={isMobile ? 'text-xs' : ''}>{skill.category}</Badge>
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
                
                <div className="responsive-stats">
                  <Card className="p-6 text-center hover-lift bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-0">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {isAdmin ? getTotalProjectCountByCategory('web-development') + getTotalProjectCountByCategory('database-projects') + getTotalProjectCountByCategory('ai-ml-projects') + getTotalProjectCountByCategory('ui-ux-design') + getTotalProjectCountByCategory('digital-art') + getTotalProjectCountByCategory('photography') + getTotalProjectCountByCategory('traditional-art') + getTotalProjectCountByCategory('creative-writing') : 
                         getProjectCountByCategory('web-development') + getProjectCountByCategory('database-projects') + getProjectCountByCategory('ai-ml-projects') + getProjectCountByCategory('ui-ux-design') + getProjectCountByCategory('digital-art') + getProjectCountByCategory('photography') + getProjectCountByCategory('traditional-art') + getProjectCountByCategory('creative-writing')}
                      </div>
                      <div className="text-sm text-muted-foreground">Proiecte {isAdmin ? 'Totale' : 'Publice'}</div>
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
                      <div className="text-3xl font-bold text-achievement-gold mb-2">
                        {isAdmin ? ACHIEVEMENTS.length : unlockedAchievements.length}
                      </div>
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


            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-6">
              <Card className={`${isMobile ? 'p-4' : 'p-8'} hover-lift`}>
                <div className="flex items-center gap-3 mb-6">
                  <Mail className="h-6 w-6 text-primary" />
                  <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-semibold`}>Informații de Contact</h2>
                </div>
                
                <div className={`${isMobile ? 'space-y-6' : 'responsive-contact'}`}>
                  <Card className="bg-gradient-to-br from-primary/5 to-gaming-accent/5 hover-lift">
                    <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                      <div className={`flex items-center gap-4 mb-6 ${isMobile ? 'flex-col text-center' : ''}`}>
                        <div className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center`}>
                          <span className={`text-white font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>MB</span>
                        </div>
                        <div>
                          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>{CONTACT_INFO.name}</h3>
                          <p className="text-muted-foreground">{CONTACT_INFO.title}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className={`flex items-center gap-3 p-3 rounded-lg bg-background/50 ${isMobile ? 'flex-col text-center' : ''}`}>
                          <Mail className="h-5 w-5 text-gaming-accent" />
                          <div>
                            <p className="font-medium">Email</p>
                            <p className="text-sm text-muted-foreground">{CONTACT_INFO.email}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-lg bg-background/50 ${isMobile ? 'flex-col text-center' : ''}`}>
                          <Phone className="h-5 w-5 text-gaming-accent" />
                          <div>
                            <p className="font-medium">Telefon</p>
                            <p className="text-sm text-muted-foreground">{CONTACT_INFO.phone}</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-lg bg-background/50 ${isMobile ? 'flex-col text-center' : ''}`}>
                          <MapPin className="h-5 w-5 text-gaming-accent" />
                          <div>
                            <p className="font-medium">Locație</p>
                            <p className="text-sm text-muted-foreground">{CONTACT_INFO.location}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover-lift">
                    <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                      <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold mb-4`}>Despre Mine</h3>
                      <p className={`text-muted-foreground leading-relaxed mb-6 ${isMobile ? 'text-sm' : ''}`}>
                        Sunt un dezvoltator creativ pasionat de tehnologie și artă. 
                        Combin cunoștințele tehnice cu viziunea artistică pentru a crea 
                        experiențe digitale unice și memorabile. Mereu în căutarea 
                        provocărilor noi și a oportunităților de învățare.
                      </p>
                      
                      <div className="mt-6">
                        <h4 className={`font-medium mb-4 ${isMobile ? 'text-sm' : ''}`}>Social Media & Links</h4>
                        <div className={`${isMobile ? 'grid grid-cols-2 gap-3' : 'responsive-social'}`}>
                          <a
                            href={CONTACT_INFO.socialMedia.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 hover:from-pink-500/20 hover:to-purple-500/20 transition-all duration-300 ${isMobile ? 'flex-col' : ''}`}
                          >
                            <svg className="h-5 w-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Instagram</span>
                          </a>
                          <a
                            href={CONTACT_INFO.socialMedia.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 transition-all duration-300 ${isMobile ? 'flex-col' : ''}`}
                          >
                            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Facebook</span>
                          </a>
                          <a
                            href={CONTACT_INFO.socialMedia.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-blue-700/10 to-blue-800/10 hover:from-blue-700/20 hover:to-blue-800/20 transition-all duration-300 ${isMobile ? 'flex-col' : ''}`}
                          >
                            <svg className="h-5 w-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>LinkedIn</span>
                          </a>
                          <a
                            href={CONTACT_INFO.socialMedia.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-gray-500/10 to-gray-600/10 hover:from-gray-500/20 hover:to-gray-600/20 transition-all duration-300 ${isMobile ? 'flex-col' : ''}`}
                          >
                            <svg className="h-5 w-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>GitHub</span>
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </Card>
            </TabsContent>

            {/* Stats Tab - Removed as it's now integrated into Skills */}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;