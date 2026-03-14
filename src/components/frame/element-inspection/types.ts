export type ElementInfoStyles = {
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  textAlign: string;
  lineHeight: string;
  letterSpacing: string;
  padding: string;
  margin: string;
  display: string;
  justifyContent: string;
  alignItems: string;
  whiteSpace: string;
  wordBreak: string;
  overflowWrap: string;
  overflow: string;
  textOverflow: string;
  wordSpacing: string;
  textTransform: string;
  textIndent: string;
  backgroundImage: string;
  backgroundClip: string;
  webkitBackgroundClip: string;
  webkitTextFillColor: string;
  borderWidth: string;
  borderStyle: string;
  borderColor: string;
  borderRadius: string;
};

export type ElementInfo = {
  elementId: string;
  tagName: string;
  rect: { top: number; left: number; width: number; height: number };
  text: string | null;
  innerHTML: string | null;
  isTextElement: boolean;
  styles: ElementInfoStyles;
};

export type HoveredElement = {
  elementId: string;
  tagName: string;
  top: number;
  left: number;
  width: number;
  height: number;
} | null;

export type SelectedElement = {
  elementId: string;
  tagName: string;
  top: number;
  left: number;
  width: number;
  height: number;
  isTextElement: boolean;
  text: string;
  innerHTML: string;
  styles: ElementInfoStyles;
} | null;
