"use client"

import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3,
  Quote, Code, Undo, Redo, Unlink
} from "lucide-react"
import { useCallback, useRef, useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
  className,
  minHeight = "160px"
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState("")
  const [showLinkPopover, setShowLinkPopover] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-2",
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none",
          "prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1",
          "prose-blockquote:my-2 prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground"
        ),
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
              event.preventDefault()
              const file = items[i].getAsFile()
              if (file) {
                const reader = new FileReader()
                reader.onload = (e) => {
                  const url = e.target?.result as string
                  editor?.chain().focus().setImage({ src: url }).run()
                }
                reader.readAsDataURL(file)
              }
              return true
            }
          }
        }
        return false
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files
        if (files && files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            if (files[i].type.startsWith("image/")) {
              event.preventDefault()
              const reader = new FileReader()
              reader.onload = (e) => {
                const url = e.target?.result as string
                editor?.chain().focus().setImage({ src: url }).run()
              }
              reader.readAsDataURL(files[i])
              return true
            }
          }
        }
        return false
      },
    },
  })

  const addLink = useCallback(() => {
    if (linkUrl) {
      editor?.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run()
      setLinkUrl("")
      setShowLinkPopover(false)
    }
  }, [editor, linkUrl])

  const removeLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run()
  }, [editor])

  const addImage = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target?.result as string
        editor?.chain().focus().setImage({ src: url }).run()
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ""
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
        {/* History */}
        <div className="flex items-center gap-0.5 pr-2 border-r mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            tooltip="실행 취소"
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            tooltip="다시 실행"
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 pr-2 border-r mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            tooltip="제목 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            tooltip="제목 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            tooltip="제목 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Text Formatting */}
        <div className="flex items-center gap-0.5 pr-2 border-r mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            tooltip="굵게"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            tooltip="기울임"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            tooltip="밑줄"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            tooltip="취소선"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
            tooltip="인라인 코드"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 pr-2 border-r mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            active={editor.isActive({ textAlign: "left" })}
            tooltip="왼쪽 정렬"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor.isActive({ textAlign: "center" })}
            tooltip="가운데 정렬"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor.isActive({ textAlign: "right" })}
            tooltip="오른쪽 정렬"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 pr-2 border-r mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            tooltip="글머리 기호"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            tooltip="번호 매기기"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            tooltip="인용구"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Link */}
        <div className="flex items-center gap-0.5 pr-2 border-r mr-2">
          <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "p-1.5 rounded hover:bg-muted transition-colors",
                  editor.isActive("link") && "bg-muted text-primary"
                )}
                title="링크 추가"
              >
                <LinkIcon className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <Label className="text-xs">링크 URL</Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="text-sm"
                  onKeyDown={(e) => e.key === "Enter" && addLink()}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addLink} className="text-xs">
                    링크 추가
                  </Button>
                  {editor.isActive("link") && (
                    <Button size="sm" variant="outline" onClick={removeLink} className="text-xs">
                      <Unlink className="h-3 w-3 mr-1" />
                      링크 제거
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Image */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={addImage}
            tooltip="이미지 삽입"
          >
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      </div>

      {/* Bubble Menu for selected text */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex items-center gap-1 p-1 bg-popover border rounded-lg shadow-lg">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              size="sm"
            >
              <Bold className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              size="sm"
            >
              <Italic className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive("underline")}
              size="sm"
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </ToolbarButton>
          </div>
        </BubbleMenu>
      )}

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className={cn("p-4 overflow-y-auto", `min-h-[${minHeight}]`)}
        style={{ minHeight }}
      />
    </div>
  )
}

// Toolbar Button Component
function ToolbarButton({
  onClick,
  active,
  disabled,
  tooltip,
  children,
  size = "default"
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  tooltip?: string
  children: React.ReactNode
  size?: "default" | "sm"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={cn(
        "rounded transition-colors",
        size === "default" ? "p-1.5" : "p-1",
        active && "bg-muted text-primary",
        !active && "hover:bg-muted",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  )
}
