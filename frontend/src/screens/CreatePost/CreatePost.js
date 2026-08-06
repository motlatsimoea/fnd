import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import imageCompression from "browser-image-compression";
import EmojiPicker from "emoji-picker-react";
import { createPost } from "../../features/blog/BlogList-slice";
import Loader from "../../components/Loader";
import Message from "../../components/Message";
import PostEditor from "../../components/editor/PostEditor";
import "./CreatePost.css";

const ALLOWED_TYPES = ["image/jpeg", "image/png","video/mp4"];

const MAX_FILE_SIZE_MB = 5;
const MAX_FILES = 4;
const DRAFT_KEY = "createPostDraft";

/**
 * Creates a preview URL for a selected image or video
 * and automatically releases it when no longer needed.
 */
const MediaPreview = ({ file }) => {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!previewUrl) {
    return null;
  }

  if (file.type.startsWith("video/")) {
    return (
      <video
        src={previewUrl}
        controls
        preload="metadata"
      />
    );
  }

  return (
    <img
      src={previewUrl}
      alt={file.name}
    />
  );
};

const CreatePost = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const editorRef = useRef(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);

  const [
    showEmojiPicker,
    setShowEmojiPicker,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [isDragging, setIsDragging] =
    useState(false);

  /** ---------- AUTO DRAFT RESTORE ---------- */
  useEffect(() => {
    const savedDraft =
      localStorage.getItem(DRAFT_KEY);

    if (!savedDraft) {
      return;
    }

    try {
      const parsed =
        JSON.parse(savedDraft);

      setTitle(parsed.title || "");
      setContent(parsed.content || "");
    } catch (draftError) {
      console.error(
        "Failed to restore post draft:",
        draftError
      );

      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  /** ---------- AUTO DRAFT SAVE ---------- */
  useEffect(() => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        title,
        content,
      })
    );
  }, [title, content]);

  /** ---------- EMOJI ---------- */
  const handleEmojiClick = (
    emojiData
  ) => {
    editorRef.current?.insertEmoji(
      emojiData.emoji
    );

    setShowEmojiPicker(false);
  };

  /** ---------- IMAGE COMPRESSION ---------- */
  const compressImage = async (
    file
  ) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      return await imageCompression(
        file,
        options
      );
    } catch (compressionError) {
      console.error(
        "Image compression failed:",
        compressionError
      );

      return file;
    }
  };

  /** ---------- FILE UPLOAD HANDLER ---------- */
  const handleFileUpload = async (
    event
  ) => {
    const selectedFiles = Array.from(
      event.target?.files || []
    );

    if (selectedFiles.length === 0) {
      return;
    }

    const availableSlots =
      MAX_FILES - files.length;

    if (availableSlots <= 0) {
      toast.error(
        `A post can contain a maximum of ${MAX_FILES} media files.`
      );

      if (event.target) {
        event.target.value = "";
      }

      return;
    }

    if (
      selectedFiles.length >
      availableSlots
    ) {
      toast.warning(
        `Only ${availableSlots} more media ${
          availableSlots === 1
            ? "file is"
            : "files are"
        } allowed.`
      );
    }

    const maximumSize =
      MAX_FILE_SIZE_MB *
      1024 *
      1024;

    const processedFiles = [];

    for (
      let file of selectedFiles.slice(
        0,
        availableSlots
      )
    ) {
      if (
        !ALLOWED_TYPES.includes(
          file.type
        )
      ) {
        toast.error(
          `Unsupported file type: ${file.name}`
        );

        continue;
      }

      if (
        file.type.startsWith(
          "image/"
        ) &&
        file.size > maximumSize
      ) {
        toast.info(
          `Compressing ${file.name}...`
        );

        file =
          await compressImage(file);
      }

      if (
        file.type.startsWith(
          "video/"
        ) &&
        file.size > maximumSize
      ) {
        toast.error(
          `${file.name} exceeds the ${MAX_FILE_SIZE_MB} MB video limit.`
        );

        continue;
      }

      if (file.size > maximumSize) {
        toast.error(
          `${file.name} is still larger than ${MAX_FILE_SIZE_MB} MB.`
        );

        continue;
      }

      processedFiles.push(file);
    }

    setFiles((previousFiles) => [
      ...previousFiles,
      ...processedFiles,
    ]);

    if (event.target) {
      event.target.value = "";
    }
  };

  const removeFile = (index) => {
    setFiles((previousFiles) =>
      previousFiles.filter(
        (_, fileIndex) =>
          fileIndex !== index
      )
    );
  };

  /** ---------- DRAG & DROP ---------- */
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (
    event
  ) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (
    event
  ) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFiles =
      Array.from(
        event.dataTransfer.files ||
          []
      );

    await handleFileUpload({
      target: {
        files: droppedFiles,
        value: "",
      },
    });
  };

  /** ---------- SUBMIT ---------- */
  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError(null);

    if (!title.trim()) {
      setError(
        "The post title is required."
      );

      return;
    }

    if (!content) {
      setError(
        "The post content is required."
      );

      return;
    }

    if (files.length > MAX_FILES) {
      setError(
        `A post can contain a maximum of ${MAX_FILES} media files.`
      );

      return;
    }

    const formData = new FormData();

    formData.append(
      "title",
      title.trim()
    );

    formData.append(
      "content",
      content
    );

    files.forEach((file) => {
      formData.append(
        "media_files",
        file
      );
    });

    try {
      setLoading(true);

      await dispatch(
        createPost(formData)
      ).unwrap();

      toast.success(
        "Post created!"
      );

      localStorage.removeItem(
        DRAFT_KEY
      );

      navigate("/");
    } catch (requestError) {
      console.error(
        "Post creation failed:",
        requestError
      );

      setError(
        typeof requestError ===
          "string"
          ? requestError
          : requestError?.detail ||
              "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-wrapper">
      <form
        className={`post-card ${
          isDragging
            ? "dragging"
            : ""
        }`}
        onSubmit={handleSubmit}
        onDragOver={
          handleDragOver
        }
        onDragLeave={
          handleDragLeave
        }
        onDrop={handleDrop}
      >
        <h2>Create a new post</h2>

        {error && (
          <Message variant="danger">
            {error}
          </Message>
        )}

        {loading && <Loader />}

        <input
          className="post-title"
          type="text"
          placeholder="Post title"
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value
            )
          }
          disabled={loading}
          required
        />

        <PostEditor
          ref={editorRef}
          onChange={setContent}
        />

        <div className="editor-toolbar">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() =>
              setShowEmojiPicker(
                (previous) =>
                  !previous
              )
            }
            disabled={loading}
            aria-label="Open emoji picker"
          >
            😄
          </button>

          <button
            type="button"
            className="toolbar-btn"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={
              loading ||
              files.length >=
                MAX_FILES
            }
            aria-label="Add media"
          >
            🖼️
          </button>

          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept="image/jpeg,image/png,video/mp4"
            multiple
            onChange={
              handleFileUpload
            }
          />

          <span className="media-count">
            {files.length}/
            {MAX_FILES}
          </span>
        </div>

        {showEmojiPicker && (
          <div className="emoji-picker-wrapper">
            <EmojiPicker
              onEmojiClick={
                handleEmojiClick
              }
            />
          </div>
        )}

        {files.length > 0 && (
          <div className="media-previews">
            {files.map(
              (file, index) => (
                <div
                  key={`${file.name}-${file.lastModified}-${index}`}
                  className="media-preview-item"
                >
                  <MediaPreview
                    file={file}
                  />

                  <button
                    type="button"
                    className="remove-media-btn"
                    onClick={() =>
                      removeFile(index)
                    }
                    disabled={loading}
                    aria-label={`Remove ${file.name}`}
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>
        )}

        <button
          type="submit"
          className="post-btn"
          disabled={loading}
        >
          {loading
            ? "Posting..."
            : "Post"}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;