import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBoxOpen,
  faPlus,
  faMagnifyingGlass,
  faArrowRight,
  faLayerGroup,
  faWallet,
  faBell,
  faSliders,
  faXmark,
  faPen,
  faTrash,
  faCircleCheck,
  faTriangleExclamation,
  faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import "./workspace.css";

const icons = {
  box: faBoxOpen,
  plus: faPlus,
  search: faMagnifyingGlass,
  arrow: faArrowRight,
  category: faLayerGroup,
  wallet: faWallet,
  bell: faBell,
  settings: faSliders,
  close: faXmark,
  edit: faPen,
  delete: faTrash,
  check: faCircleCheck,
  warning: faTriangleExclamation,
  order: faReceipt,
};

export function Icon({ name, className = "", ...props }) {
  return (
    <FontAwesomeIcon
      icon={icons[name] || faBoxOpen}
      className={`aw-icon ${className}`.trim()}
      {...props}
    />
  );
}

export function PageHeading({ section, title, description, children }) {
  return (
    <div className="aw-heading">
      <div>
        <div className="aw-breadcrumb">
          Workspace <span>/</span> {section || title}
        </div>
        <h1 className="aw-title">{title}</h1>
        <p className="aw-subtitle">{description}</p>
      </div>
      <div className="aw-heading-actions">{children}</div>
    </div>
  );
}

export function EmptyState({ title, description, icon = "box", children }) {
  return (
    <div className="aw-empty">
      <span className="aw-empty-icon">
        <Icon name={icon} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}

export function Metric({ label, value, detail, icon, tone = "green" }) {
  return (
    <div className={`aw-metric aw-tone-${tone}`}>
      <div className="aw-metric-top">
        <span>{label}</span>
        <Icon name={icon} />
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
