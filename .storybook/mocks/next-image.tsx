import React from "react";

const Image = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    priority?: boolean;
    quality?: number;
    unoptimized?: boolean;
  }
>(
  (
    {
      fill: _fill,
      priority: _priority,
      quality: _quality,
      unoptimized: _unoptimized,
      ...props
    },
    ref,
  ) => (
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    <img ref={ref} {...props} />
  ),
);

Image.displayName = "Image";
export default Image;
