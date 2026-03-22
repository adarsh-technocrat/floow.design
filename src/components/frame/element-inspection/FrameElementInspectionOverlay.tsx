"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import type {
  ElementInfoStyles,
  HoveredElement,
  SelectedElement,
} from "@/components/frame/element-inspection/types";
import { useFrameElementInspection } from "@/hooks/use-frame-element-inspection";
import FrameElementToolbar from "./FrameElementToolbar";

export type OnElementSelectedPayload = {
  selectedElement: SelectedElement | null;
  elementClasses: string[];
};

export type ElementHighlightOverlayProps = {
  top: number;
  left: number;
  width: number;
  height: number;
  tagName: string;
  isSelected?: boolean;
  isTextElement?: boolean;
};

function ElementHighlightOverlay({
  top,
  left,
  width,
  height,
  tagName,
  isSelected = false,
  isTextElement = false,
}: ElementHighlightOverlayProps) {
  const borderStyle = isSelected ? "border-dotted" : "border-solid";
  const backgroundColor = isSelected
    ? "transparent"
    : "bg-blue-500/10 dark:bg-blue-500/20";

  return (
    <>
      <div
        className={`absolute pointer-events-none border-2 border-blue-500 ${borderStyle} ${backgroundColor}`}
        style={{ top, left, width, height }}
      />
      <div
        className="absolute pointer-events-none flex items-center gap-1 px-1.5 py-0.5 bg-blue-500 text-white text-[11px] font-mono font-medium rounded-sm whitespace-nowrap"
        style={{
          top: Math.max(0, top - 18),
          left: Math.max(0, left),
        }}
      >
        {`<${tagName}>`}
        {isSelected && isTextElement && (
          <span className="bg-white/20 px-1 rounded text-[8px]">editable</span>
        )}
      </div>
    </>
  );
}

type InlineTextEditorProps = {
  innerHTML: string;
  onSubmit: (newHTML: string) => void;
  onCancel: () => void;
  onInput?: (html: string, editorEl?: HTMLElement | null) => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
  position: { top: number; left: number; width: number; height: number };
  styles: ElementInfoStyles;
  editId?: string;
};

function InlineTextEditor({
  innerHTML,
  onSubmit,
  onCancel,
  onInput,
  editorRef,
  position,
  styles,
  editId,
}: InlineTextEditorProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(editorRef.current?.innerHTML ?? "");
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleBlur = () => {
    onSubmit(editorRef.current?.innerHTML ?? "");
  };

  const handleInput = () => {
    onInput?.(editorRef.current?.innerHTML ?? "", editorRef.current);
  };

  const useFlexboxCentering = styles.display === "flex";
  const isHorizontallyCentered =
    styles.justifyContent === "center" || styles.textAlign === "center";
  const textAlign = isHorizontallyCentered
    ? "center"
    : (styles.textAlign as React.CSSProperties["textAlign"]);

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      dangerouslySetInnerHTML={{ __html: innerHTML }}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onInput={handleInput}
      onClick={(e) => e.stopPropagation()}
      className="absolute pointer-events-auto focus:outline-none m-0 box-border"
      data-uxm-editing="true"
      data-uxm-edit-sync={editId}
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        minHeight: position.height,
        height: "auto",
        fontSize: styles.fontSize,
        fontWeight: styles.fontWeight,
        fontFamily: styles.fontFamily,
        color: styles.webkitTextFillColor || styles.color,
        textAlign,
        lineHeight: styles.lineHeight,
        letterSpacing: styles.letterSpacing,
        padding: useFlexboxCentering ? "0" : styles.padding,
        display: useFlexboxCentering ? "flex" : "block",
        alignItems: styles.alignItems || "center",
        justifyContent: isHorizontallyCentered ? "center" : "flex-start",
        whiteSpace: styles.whiteSpace as React.CSSProperties["whiteSpace"],
        wordBreak: styles.wordBreak as React.CSSProperties["wordBreak"],
        overflowWrap:
          styles.overflowWrap as React.CSSProperties["overflowWrap"],
        overflow: styles.overflow as React.CSSProperties["overflow"],
        textOverflow:
          styles.textOverflow as React.CSSProperties["textOverflow"],
        wordSpacing: styles.wordSpacing,
        textTransform:
          styles.textTransform as React.CSSProperties["textTransform"],
        textIndent: styles.textIndent,
        backgroundColor: styles.backgroundColor,
        backgroundImage:
          styles.backgroundImage !== "none"
            ? styles.backgroundImage
            : undefined,
        backgroundClip:
          styles.backgroundClip as React.CSSProperties["backgroundClip"],
        WebkitBackgroundClip: styles.webkitBackgroundClip as React.CSSProperties["WebkitBackgroundClip"],
        WebkitTextFillColor:
          styles.webkitTextFillColor as React.CSSProperties["WebkitTextFillColor"],
        borderWidth: styles.borderWidth,
        borderStyle: styles.borderStyle as React.CSSProperties["borderStyle"],
        borderColor: styles.borderColor,
        borderRadius: styles.borderRadius,
        caretColor: styles.webkitTextFillColor ? "#3b82f6" : undefined,
        outline: "2px dashed #3b82f6",
        outlineOffset: "1px",
      }}
    />
  );
}

export interface FrameElementInspectionOverlayProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  enabled: boolean;
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  onElementSelected?: (info: OnElementSelectedPayload) => void;
}

export default function FrameElementInspectionOverlay({
  iframeRef,
  overlayRef,
  enabled,
  zoom = 1,
  className = "",
  style,
  onElementSelected,
}: FrameElementInspectionOverlayProps) {
  const editDivRef = useRef<HTMLDivElement>(null);

  const inspection = useFrameElementInspection({
    iframeRef,
    overlayRef,
    enabled,
  });

  const {
    hoveredElement,
    selectedElement,
    isEditing,
    editText,
    elementClasses,
    showTailwindMenu,
    setShowTailwindMenu,
    newClassInput,
    setNewClassInput,
    handleOverlayMouseMove,
    handleOverlayMouseLeave,
    handleOverlayClick,
    submitTextEdit,
    cancelTextEdit,
    syncTextToIframeLive,
    handleToggleBold,
    handleToggleItalic,
    handleToggleUnderline,
    handleToggleStrikethrough,
    handleSetAlignLeft,
    handleSetAlignCenter,
    handleSetAlignRight,
    handleSetAlignJustify,
    handleAddClass,
    handleRemoveClass,
    handleSetColor,
    handleSetFontSize,
    handleSetFontFamily,
    handleDeleteElement,
    applyStyleToElement,
  } = inspection;

  useEffect(() => {
    if (isEditing && editDivRef.current) {
      editDivRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(editDivRef.current);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  useEffect(() => {
    onElementSelected?.({
      selectedElement: selectedElement ?? null,
      elementClasses,
    });
  }, [selectedElement, elementClasses, onElementSelected]);

  const isHoveringDifferentElement =
    hoveredElement && hoveredElement.elementId !== selectedElement?.elementId;

  if (!enabled) return null;

  return (
    <div
      ref={overlayRef}
      className={`absolute inset-0 ${className}`}
      style={{
        cursor: isEditing ? "default" : "crosshair",
        pointerEvents: "auto",
        zIndex: 60,
        ...style,
      }}
      onMouseMove={handleOverlayMouseMove}
      onMouseLeave={handleOverlayMouseLeave}
      onClick={handleOverlayClick}
    >
      {isHoveringDifferentElement && hoveredElement && (
        <ElementHighlightOverlay
          top={hoveredElement.top}
          left={hoveredElement.left}
          width={hoveredElement.width}
          height={hoveredElement.height}
          tagName={hoveredElement.tagName}
        />
      )}

      {selectedElement && (
        <>
          {isEditing && selectedElement.isTextElement ? (
            <InlineTextEditor
              innerHTML={editText}
              onSubmit={(html) => submitTextEdit(html)}
              onCancel={cancelTextEdit}
              onInput={syncTextToIframeLive}
              editorRef={editDivRef}
              editId={selectedElement.elementId}
              position={{
                top: selectedElement.top,
                left: selectedElement.left,
                width: selectedElement.width,
                height: selectedElement.height,
              }}
              styles={selectedElement.styles}
            />
          ) : (
            <ElementHighlightOverlay
              top={selectedElement.top}
              left={selectedElement.left}
              width={selectedElement.width}
              height={selectedElement.height}
              tagName={selectedElement.tagName}
              isSelected
              isTextElement={selectedElement.isTextElement}
            />
          )}
          {isEditing && selectedElement.isTextElement && (
            <div
              className="absolute pointer-events-none flex items-center gap-1 px-1.5 py-0.5 bg-blue-500 text-white text-[11px] font-mono font-medium rounded-sm whitespace-nowrap"
              style={{
                top: Math.max(0, selectedElement.top - 18),
                left: Math.max(0, selectedElement.left),
              }}
            >
              {`<${selectedElement.tagName}>`}
              <span className="bg-white/20 px-1 rounded text-[8px]">
                editable
              </span>
            </div>
          )}
        </>
      )}

      {selectedElement && (
        <FrameElementToolbar
          selectedElement={selectedElement}
          elementClasses={elementClasses}
          showTailwindMenu={showTailwindMenu}
          setShowTailwindMenu={setShowTailwindMenu}
          newClassInput={newClassInput}
          setNewClassInput={setNewClassInput}
          onToggleBold={handleToggleBold}
          onToggleItalic={handleToggleItalic}
          onToggleUnderline={handleToggleUnderline}
          onToggleStrikethrough={handleToggleStrikethrough}
          onSetAlignLeft={handleSetAlignLeft}
          onSetAlignCenter={handleSetAlignCenter}
          onSetAlignRight={handleSetAlignRight}
          onSetAlignJustify={handleSetAlignJustify}
          onAddClass={handleAddClass}
          onRemoveClass={handleRemoveClass}
          onSetColor={handleSetColor}
          onSetFontSize={handleSetFontSize}
          onSetFontFamily={handleSetFontFamily}
          onDeleteElement={handleDeleteElement}
          onApplyStyle={
            selectedElement
              ? (styles) =>
                  applyStyleToElement(selectedElement.elementId, styles)
              : undefined
          }
          zoom={zoom}
          overlayRef={overlayRef}
        />
      )}
    </div>
  );
}
