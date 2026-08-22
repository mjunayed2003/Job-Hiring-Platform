import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import {
  useGetPageQuery,
  useUpdatePageMutation,
} from "../../../redux/features/settingsApi/settingsApi";

const ToolBtn = ({ active, onClick, title, children }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`flex items-center justify-center w-8 h-8 rounded transition-colors text-sm select-none ${
      active ? "bg-[#43B948]/15 text-[#43B948]" : "text-gray-600 hover:bg-gray-100"
    }`}
  >
    {children}
  </button>
);

const Sep = () => <div className="w-px h-5 bg-gray-200 mx-1 self-center" />;

const HeadingSelect = ({ editor }) => {
  if (!editor) return null;
  const current = editor.isActive("heading", { level: 1 }) ? "1"
    : editor.isActive("heading", { level: 2 }) ? "2"
    : editor.isActive("heading", { level: 3 }) ? "3"
    : "0";
  return (
    <select
      value={current}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "0") editor.chain().focus().setParagraph().run();
        else editor.chain().focus().toggleHeading({ level: parseInt(v) }).run();
      }}
      className="h-8 px-2 text-sm font-medium border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus:border-[#43B948] cursor-pointer"
    >
      <option value="0">¶ Normal</option>
      <option value="1">H1</option>
      <option value="2">H2</option>
      <option value="3">H3</option>
    </select>
  );
};

const ListSelect = ({ editor }) => {
  if (!editor) return null;
  const current = editor.isActive("bulletList") ? "bullet"
    : editor.isActive("orderedList") ? "ordered" : "none";
  return (
    <select
      value={current}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "bullet") editor.chain().focus().toggleBulletList().run();
        else if (v === "ordered") editor.chain().focus().toggleOrderedList().run();
        else {
          if (editor.isActive("bulletList")) editor.chain().focus().toggleBulletList().run();
          if (editor.isActive("orderedList")) editor.chain().focus().toggleOrderedList().run();
        }
      }}
      className="h-8 px-2 text-sm font-medium border border-gray-200 rounded bg-white text-gray-700 focus:outline-none focus:border-[#43B948] cursor-pointer"
    >
      <option value="none">≡ List</option>
      <option value="bullet">• Bullet</option>
      <option value="ordered">1. Numbered</option>
    </select>
  );
};

const Toolbar = ({ editor, isEditing, isSaving, onEdit, onCancel, onSave }) => (
  <div className="flex items-center gap-1 px-4 py-2 bg-white border-b border-gray-200 sticky top-0 z-10 flex-wrap shadow-sm">
    <HeadingSelect editor={editor} />
    <ListSelect editor={editor} />
    <Sep />
    <ToolBtn active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()} title="Bold"><b>B</b></ToolBtn>
    <ToolBtn active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Italic"><i>I</i></ToolBtn>
    <ToolBtn active={editor?.isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()} title="Strikethrough"><s>S</s></ToolBtn>
    <ToolBtn active={editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Underline"><u>U</u></ToolBtn>
    <ToolBtn active={editor?.isActive("highlight")} onClick={() => editor?.chain().focus().toggleHighlight().run()} title="Highlight"><span className="font-bold text-yellow-500">A</span></ToolBtn>
    <Sep />
    <ToolBtn active={editor?.isActive({ textAlign: "left" })} onClick={() => editor?.chain().focus().setTextAlign("left").run()} title="Align Left">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="2" rx="1"/><rect x="3" y="10" width="12" height="2" rx="1"/><rect x="3" y="15" width="18" height="2" rx="1"/><rect x="3" y="20" width="12" height="2" rx="1"/></svg>
    </ToolBtn>
    <ToolBtn active={editor?.isActive({ textAlign: "center" })} onClick={() => editor?.chain().focus().setTextAlign("center").run()} title="Align Center">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="2" rx="1"/><rect x="6" y="10" width="12" height="2" rx="1"/><rect x="3" y="15" width="18" height="2" rx="1"/><rect x="6" y="20" width="12" height="2" rx="1"/></svg>
    </ToolBtn>
    <ToolBtn active={editor?.isActive({ textAlign: "right" })} onClick={() => editor?.chain().focus().setTextAlign("right").run()} title="Align Right">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="2" rx="1"/><rect x="9" y="10" width="12" height="2" rx="1"/><rect x="3" y="15" width="18" height="2" rx="1"/><rect x="9" y="20" width="12" height="2" rx="1"/></svg>
    </ToolBtn>
    <ToolBtn active={editor?.isActive({ textAlign: "justify" })} onClick={() => editor?.chain().focus().setTextAlign("justify").run()} title="Justify">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="5" width="18" height="2" rx="1"/><rect x="3" y="10" width="18" height="2" rx="1"/><rect x="3" y="15" width="18" height="2" rx="1"/><rect x="3" y="20" width="18" height="2" rx="1"/></svg>
    </ToolBtn>
    <Sep />
    <ToolBtn active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="Blockquote">❝</ToolBtn>

    <div className="ml-auto flex items-center gap-2">
      {isEditing ? (
        <>
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">Cancel</button>
          <button type="button" onClick={onSave} disabled={isSaving} className="px-4 py-1.5 text-sm text-white bg-[#43B948] hover:bg-green-600 rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5">
            {isSaving ? "Saving…" : "Save"}
          </button>
        </>
      ) : (
        <button type="button" onClick={onEdit} className="px-4 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit Page
        </button>
      )}
    </div>
  </div>
);

const AboutUs = () => {
  const pageName = "about_us";
  const { data, isLoading } = useGetPageQuery(pageName);
  const [updatePage, { isLoading: isSaving }] = useUpdatePageMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("About Us");
  const savedTitle = useRef("About Us");
  const savedContent = useRef("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    editable: false,
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[500px] text-gray-800 text-[15px] leading-7",
        spellcheck: "true",
      },
    },
  });

  useEffect(() => {
    if (editor) editor.setEditable(isEditing);
  }, [isEditing, editor]);

  useEffect(() => {
    if (data && editor) {
      const t = data?.data?.title || "About Us";
      const c = data?.data?.content || "";
      setTitle(t);
      savedTitle.current = t;
      savedContent.current = c;
      editor.commands.setContent(c);
    }
  }, [data, editor]);

  const handleCancel = () => {
    editor.commands.setContent(savedContent.current);
    setTitle(savedTitle.current);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const html = editor.getHTML();
      const result = await updatePage({ pageName, data: { title, content: html } }).unwrap();
      const updated = result?.data;
      savedTitle.current = updated?.title ?? title;
      savedContent.current = updated?.content ?? html;
      setIsEditing(false);
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 flex flex-col">
      <Toolbar editor={editor} isEditing={isEditing} isSaving={isSaving} onEdit={() => setIsEditing(true)} onCancel={handleCancel} onSave={handleSave} />
      <div className="flex-1 flex justify-center py-10 px-4">
        <div className="w-full max-w-[820px] bg-white shadow-md rounded-sm px-16 py-14 min-h-[1000px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading content…</div>
          ) : (
            <>
              {isEditing ? (
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page Title" className="w-full text-2xl font-bold text-gray-900 mb-8 border-b-2 border-[#43B948] focus:outline-none bg-transparent pb-1" />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900 mb-8 pb-2 border-b border-dashed border-gray-200">{title}</h1>
              )}
              <EditorContent editor={editor} />
            </>
          )}
        </div>
      </div>
      <style>{`
        .ProseMirror { outline: none; }
        .ProseMirror p { margin-bottom: 0.75rem; }
        .ProseMirror h1 { font-size: 1.6rem; font-weight: 700; color: #111827; margin: 1.5rem 0 0.75rem; }
        .ProseMirror h2 { font-size: 1.2rem; font-weight: 700; color: #1f2937; margin: 1.25rem 0 0.5rem; }
        .ProseMirror h3 { font-size: 1rem; font-weight: 600; color: #374151; margin: 1rem 0 0.4rem; }
        .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0 0.75rem; }
        .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0 0.75rem; }
        .ProseMirror li { margin-bottom: 0.25rem; }
        .ProseMirror blockquote { border-left: 3px solid #43B948; padding-left: 1rem; color: #6b7280; font-style: italic; margin: 1rem 0; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror u { text-decoration: underline; }
        .ProseMirror s { text-decoration: line-through; }
        .ProseMirror mark { background-color: #fef08a; padding: 0 2px; border-radius: 2px; }
        .ProseMirror[contenteditable="true"] { cursor: text; }
        .ProseMirror[contenteditable="false"] { cursor: default; }
      `}</style>
    </div>
  );
};

export default AboutUs;