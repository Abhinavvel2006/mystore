import { useState } from "react";
import "./ProfileAvatar.css";

function getPhotoUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function AvatarContent({ photoUrl, initials }) {
  const [imageFailed, setImageFailed] = useState(false);

  return photoUrl && !imageFailed ? (
    <img
      src={photoUrl}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setImageFailed(true)}
    />
  ) : (
    <span>{initials}</span>
  );
}

export default function ProfileAvatar({ user, size = "small", className = "" }) {
  const name = typeof user?.name === "string" ? user.name.trim() : "";
  const words = name.split(/\s+/).filter(Boolean);
  const initials = words.length
    ? `${words[0][0]}${words.length > 1 ? words[words.length - 1][0] : ""}`
    : typeof user?.email === "string" && user.email.trim()
      ? user.email.trim()[0]
      : "U";
  const photoUrl = getPhotoUrl(user?.photoURL);

  return (
    <span
      className={`profile-avatar${size === "large" ? " profile-avatar-large" : ""}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      <AvatarContent
        key={photoUrl}
        photoUrl={photoUrl}
        initials={initials.toUpperCase()}
      />
    </span>
  );
}
