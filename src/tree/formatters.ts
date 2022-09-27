///////////////////////////////////////////////////////////////////////////////
//
// Formatters
//
///////////////////////////////////////////////////////////////////////////////
export function hyperlink(href: string) {
  const text = 'link';
  if (href) {
    return {href, text};
  } else {
    return '';
  }
}

export function dollars(value: number) {
  const formatting_options = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  };
  const dollarString = new Intl.NumberFormat('en-US', formatting_options);
  return dollarString.format(value);
}
