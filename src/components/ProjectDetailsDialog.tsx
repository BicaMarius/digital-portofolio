import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Calendar,
  Clock,
  Code2,
  Database,
  FileText,
  Github,
  Globe,
  Lock,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
} from 'lucide-react';
import type { Project } from '@shared/schema';

interface ProjectDetailsDialogProps {
  project: Project;
  open: boolean;
  onClose: () => void;
}

export const ProjectDetailsDialog: React.FC<ProjectDetailsDialogProps> = ({
  project,
  open,
  onClose,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const hasImages = project.images && project.images.length > 0;
  const allImages = hasImages
    ? project.images
    : project.image
    ? [project.image]
    : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {project.icon && (
              <div className="flex-shrink-0">
                {project.icon.startsWith('http') ? (
                  <img
                    src={project.icon}
                    alt=""
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <span className="text-4xl">{project.icon}</span>
                )}
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-2xl">{project.title}</DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {project.projectType && (
                  <Badge variant="outline" className="text-sm">
                    {project.projectType}
                  </Badge>
                )}
                {project.isPrivate && (
                  <Badge variant="secondary" className="text-sm">
                    <Lock className="h-3 w-3 mr-1" />
                    Privat
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Image Gallery */}
            {allImages.length > 0 && (
              <div className="relative">
                {allImages.length === 1 ? (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={allImages[0]}
                      alt={project.title}
                      className="w-full h-[300px] object-cover"
                    />
                  </div>
                ) : (
                  <Carousel className="w-full">
                    <CarouselContent>
                      {allImages.map((image, index) => (
                        <CarouselItem key={index}>
                          <div className="rounded-lg overflow-hidden">
                            <img
                              src={image}
                              alt={`${project.title} - Image ${index + 1}`}
                              className="w-full h-[300px] object-cover"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2" />
                    <CarouselNext className="right-2" />
                  </Carousel>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Descriere</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {project.description}
              </p>
            </div>

            <Separator />

            {/* Project Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.initialReleaseDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Prima Versiune</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(project.initialReleaseDate)}
                    </p>
                  </div>
                </div>
              )}

              {project.lastUpdatedDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Ultima Actualizare</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(project.lastUpdatedDate)}
                    </p>
                  </div>
                </div>
              )}

              {project.hoursWorked && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Ore Lucrate</p>
                    <p className="text-sm text-muted-foreground">
                      {project.hoursWorked} ore
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Technologies */}
            {(project.frontendTech && project.frontendTech.length > 0) ||
            (project.backendTech && project.backendTech.length > 0) ? (
              <>
                <Separator />
                <div className="space-y-4">
                  {project.frontendTech && project.frontendTech.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Code2 className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Frontend</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.frontendTech.map((tech) => (
                          <Badge key={tech} variant="default">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.backendTech && project.backendTech.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Database className="h-5 w-5 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Backend</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {project.backendTech.map((tech) => (
                          <Badge key={tech} variant="default">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : null}

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tag-uri</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Links */}
            {(project.gitUrl || project.projectUrl) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Link-uri</h3>
                  {project.gitUrl && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a
                        href={project.gitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="h-4 w-4 mr-2" />
                        Vezi pe GitHub
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </a>
                    </Button>
                  )}
                  {project.projectUrl && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Vizitează Proiectul
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </a>
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Additional Files */}
            {project.additionalFiles && project.additionalFiles.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Fișiere Adiționale</h3>
                  <div className="space-y-2">
                    {project.additionalFiles.map((file, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start"
                        asChild
                      >
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Fișier {index + 1}
                          <Download className="h-3 w-3 ml-auto" />
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Metadata */}
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              {project.createdAt && (
                <p>
                  Creat la:{' '}
                  {new Date(project.createdAt).toLocaleDateString('ro-RO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
              {project.updatedAt && (
                <p>
                  Ultima modificare:{' '}
                  {new Date(project.updatedAt).toLocaleDateString('ro-RO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
