import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode; // Right-side content (actions, toggles, etc.)
  showBackButton?: boolean; // Show explicit back button before logo
  backTo?: string; // Where back button goes (defaults to /briefs)
}

const Header: React.FC<HeaderProps> = ({
  breadcrumbs = [],
  children,
  showBackButton = false,
  backTo = '/briefs'
}) => {
  const navigate = useNavigate();

  return (
    <header className="h-12 bg-[#161616] flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center">
        {showBackButton && (
          <>
            <button
              onClick={() => navigate(backTo)}
              className="text-[#c6c6c6] hover:text-white transition-colors flex items-center gap-1 mr-3"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="mr-3 text-[#525252]">|</span>
          </>
        )}

        <Link to="/" className="flex items-center">
          <img
            src="/pg-seeklogo.svg"
            alt="P&G"
            className="w-[30px] my-[5px]"
          />
        </Link>
        <span className="mx-3 text-[#525252]">/</span>
        <Link to="/" className="text-[#c6c6c6] text-sm hover:text-white transition-colors">
          Pink Brief Architect
        </Link>

        {breadcrumbs.map((item, index) => (
          <React.Fragment key={index}>
            <span className="mx-3 text-[#525252]">/</span>
            {item.href ? (
              <Link
                to={item.href}
                className="text-[#c6c6c6] text-sm hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[#c6c6c6] text-sm">{item.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {children && (
        <div className="flex items-center gap-4">
          {children}
        </div>
      )}
    </header>
  );
};

export default Header;
