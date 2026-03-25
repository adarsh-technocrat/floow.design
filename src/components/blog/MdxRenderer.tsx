import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { mdxComponents, TLDR, Callout, KeyTakeaways } from "./MdxComponents";

const components = {
  ...mdxComponents,
  TLDR,
  Callout,
  KeyTakeaways,
};

const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
  },
};

export function MdxRenderer({ source }: { source: string }) {
  return (
    <div className="mdx-content">
      <MDXRemote source={source} components={components} options={mdxOptions} />
    </div>
  );
}
