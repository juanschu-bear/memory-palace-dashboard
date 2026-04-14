import { Link } from "react-router-dom";
import { AVATARS, type AvatarProfile } from "@/lib/avatars";

export interface AvatarCounts {
  [slug: string]: string | number | undefined;
}

interface AvatarSelectorProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  hrefFor: (avatar: AvatarProfile) => string;
  countFor?: (avatar: AvatarProfile) => string;
  children?: React.ReactNode;
}

export default function AvatarSelector({
  title,
  subtitle,
  eyebrow,
  hrefFor,
  countFor,
  children,
}: AvatarSelectorProps) {
  return (
    <div className="selector-page">
      <div className="selector-starfield" aria-hidden />
      <div className="selector-inner">
        <section className="selector-header">
          {eyebrow ? <p className="selector-eyebrow">{eyebrow}</p> : null}
          <h1 className="selector-title">{title}</h1>
          <p className="selector-subtitle">{subtitle}</p>
        </section>

        <div className="avatar-grid">
          {AVATARS.map((avatar, idx) => (
            <Link
              key={avatar.slug}
              to={hrefFor(avatar)}
              className="avatar-card"
            >
              <div className="avatar-card-top">
                <span className="avatar-card-index">{String(idx + 1).padStart(2, "0")}</span>
                <span className="avatar-card-wing">{avatar.wing}</span>
              </div>
              <div className="avatar-card-initials">{avatar.initials}</div>
              <div className="avatar-card-body">
                <h2 className="avatar-card-name">{avatar.name}</h2>
                <p className="avatar-card-role">{avatar.role}</p>
              </div>
              <div className="avatar-card-footer">
                <span className="avatar-card-count">
                  {countFor ? countFor(avatar) : "Explore"}
                </span>
                <span className="avatar-card-arrow">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}
