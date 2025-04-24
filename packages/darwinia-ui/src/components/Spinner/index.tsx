import React, { useRef } from "react";
import { CSSTransition } from "react-transition-group";

export interface SpinnerProps {
  active?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
  className?: string;
  maskClassName?: string;
  spinnerText?: string;
  size?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  active = true,
  children,
  isLoading = false,
  className = "",
  maskClassName = "",
  spinnerText,
  size = "medium",
  ...props
}) => {
  const nodeRef = useRef(null);

  return (
    <CSSTransition in={active || isLoading} timeout={300} classNames="spinner" unmountOnExit nodeRef={nodeRef}>
      <div ref={nodeRef} className={`spinner-container ${className}`} {...props}>
        {spinnerText && <div className="spinner-text">{spinnerText}</div>}
        <div className={`spinner-mask ${maskClassName}`}></div>
        {children}
      </div>
    </CSSTransition>
  );
};

export default Spinner;
