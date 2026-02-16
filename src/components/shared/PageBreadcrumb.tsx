import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbConfig {
  label: string;
  icon?: React.ReactNode;
}

const routeLabels: Record<string, BreadcrumbConfig> = {
  '': { label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
  'proposals': { label: 'Propuestas' },
  'new': { label: 'Nueva Propuesta' },
  'list': { label: 'Lista' },
  'evaluations': { label: 'Evaluaciones' },
  'admin': { label: 'Administración' },
  'panel': { label: 'Panel' },
};

export function PageBreadcrumb() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Don't show breadcrumb on dashboard
  if (pathSegments.length === 0) {
    return null;
  }

  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const config = routeLabels[segment] || { label: segment };
    const isLast = index === pathSegments.length - 1;
    // Check if segment is a dynamic ID (starts with prop- or eval- or is alphanumeric)
    const isDynamicId = /^(prop-|eval-|[a-f0-9-]{8,})/.test(segment);

    return {
      path,
      label: isDynamicId ? `#${segment.slice(0, 8)}...` : config.label,
      isLast,
    };
  });

  return (
    <Breadcrumb className="mb-4 animate-fade-in">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Home className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Inicio</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbs.map((crumb, index) => (
          <BreadcrumbItem key={crumb.path}>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            {crumb.isLast ? (
              <BreadcrumbPage className="font-medium">
                {crumb.label}
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={crumb.path} className="hover:text-primary transition-colors">
                  {crumb.label}
                </Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
