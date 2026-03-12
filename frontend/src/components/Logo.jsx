import logoImage from '../assets/therapease-logo.png';

export const Logo = ({ className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <img 
      src={logoImage} 
      alt="TherapEase Logo" 
      className="h-12 w-auto"
    />
  </div>
);
