import React, { forwardRef } from 'react';
import './ui.css';

/**
 * Button from the AT-ICT design system.
 * variant: 'primary' | 'outline' (on dark) | 'light' (outline on light) | 'white' | 'whatsapp'
 * Pass `as` to render a link (e.g. as={Link} to="/" or as="a" href="…").
 */
const Button = forwardRef(function Button(
  { as: Component = 'button', variant = 'primary', size = 'md', block = false, loading = false, className = '', children, ...props },
  ref
) {
  const classes = ['ui-btn', `ui-btn--${variant}`, size === 'sm' && 'ui-btn--sm', block && 'ui-btn--block', className]
    .filter(Boolean)
    .join(' ');
  const buttonProps = Component === 'button' ? { type: props.type || 'button', disabled: props.disabled || loading } : {};

  return (
    <Component ref={ref} className={classes} aria-busy={loading || undefined} {...props} {...buttonProps}>
      {loading && <span className="ui-btn__spinner" aria-hidden="true" />}
      {children}
    </Component>
  );
});

export default Button;
