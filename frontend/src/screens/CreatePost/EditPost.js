import React, { useEffect, useState, useRef } from "react";

import { useDispatch, useSelector } from "react-redux";

import { useNavigate, useParams } from "react-router-dom";

import { toast } from "react-toastify";
import imageCompression from "browser-image-compression";

import {
  fetchSinglePost,
  updatePost,
} from "../../features/blog/BlogList-slice";

import Loader from "../../components/Loader";
import Message from "../../components/Message";
import PostEditor from "../../components/editor/PostEditor";
import "./CreatePost.css";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "video/mp4",
];

const MAX_FILE_SIZE_MB = 5;
const MAX_FILES = 4;

/**
 * Handles object URL creation and cleanup for newly selected files.
 */
const NewMediaPreview = ({ file }) => {
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

const EditPost = () => {
  const { id } = useParams();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    singlePost,
    loading,
    error,
  } = useSelector(
    (state) => state.BlogList
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [existingMedia, setExistingMedia] =
    useState([]);

  const [files, setFiles] = useState([]);

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [updateError, setUpdateError] =
    useState(null);

  useEffect(() => {
    dispatch(fetchSinglePost(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (
      singlePost &&
      String(singlePost.id) === String(id)
    ) {
      setTitle(singlePost.title || "");
      setContent(singlePost.content || "");
      setExistingMedia(singlePost.media || []);
      setFiles([]);
      setUpdateError(null);
    }
  }, [singlePost, id]);

  const compressImage = async (file) => {
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

  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    const availableSlots =
      MAX_FILES -
      existingMedia.length -
      files.length;

    if (availableSlots <= 0) {
      toast.error(
        `A post can contain a maximum of ${MAX_FILES} media files.`
      );

      event.target.value = "";
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

    const processedFiles = [];

    for (
      let file of selectedFiles.slice(
        0,
        availableSlots
      )
    ) {
      if (
        !ALLOWED_TYPES.includes(file.type)
      ) {
        toast.error(
          `Unsupported file type: ${file.name}`
        );

        continue;
      }

      if (
        file.type.startsWith("video/") &&
        file.size >
          MAX_FILE_SIZE_MB *
            1024 *
            1024
      ) {
        toast.error(
          `${file.name} is larger than ${MAX_FILE_SIZE_MB} MB.`
        );

        continue;
      }

      if (
        file.type.startsWith("image/") &&
        file.size >
          MAX_FILE_SIZE_MB *
            1024 *
            1024
      ) {
        toast.info(
          `Compressing ${file.name}...`
        );

        file = await compressImage(file);
      }

      if (
        file.size >
        MAX_FILE_SIZE_MB *
          1024 *
          1024
      ) {
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

    event.target.value = "";
  };

  const removeNewFile = (index) => {
    setFiles((previousFiles) =>
      previousFiles.filter(
        (_, fileIndex) =>
          fileIndex !== index
      )
    );
  };

  const removeExistingMedia = (
    mediaId
  ) => {
    setExistingMedia(
      (previousMedia) =>
        previousMedia.filter(
          (media) =>
            String(media.id) !==
            String(mediaId)
        )
    );
  };

  const getExistingMediaType = (
    media
  ) => {
    const declaredType = (
      media.file_type ||
      media.content_type ||
      ""
    ).toLowerCase();

    if (
      declaredType === "video" ||
      declaredType.startsWith(
        "video/"
      )
    ) {
      return "video";
    }

    if (
      declaredType === "image" ||
      declaredType.startsWith(
        "image/"
      )
    ) {
      return "image";
    }

    const fileUrl = (
      media.file || ""
    ).toLowerCase();

    if (
      /\.(mp4|webm|ogg|mov)(\?.*)?$/.test(
        fileUrl
      )
    ) {
      return "video";
    }

    return "image";
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setUpdateError(null);

    if (!title.trim()) {
      setUpdateError(
        "The post title is required."
      );

      return;
    }

    if (!content) {
      setUpdateError(
        "The post content is required."
      );

      return;
    }

    const totalMedia =
      existingMedia.length +
      files.length;

    if (totalMedia > MAX_FILES) {
      setUpdateError(
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

    /*
     * Tells the backend that this request
     * intentionally includes media syncing.
     */
    formData.append(
      "sync_media",
      "true"
    );

    existingMedia.forEach((media) => {
      formData.append(
        "existing_media_ids[]",
        String(media.id)
      );
    });

    files.forEach((file) => {
      formData.append(
        "media_files",
        file
      );
    });

    try {
      setIsUpdating(true);

      await dispatch(
        updatePost({
          postId: id,
          formData,
        })
      ).unwrap();

      toast.success(
        "Post updated successfully."
      );

      navigate(`/blog/${id}`);
    } catch (requestError) {
      console.error(
        "Post update failed:",
        requestError
      );

      setUpdateError(
        typeof requestError ===
          "string"
          ? requestError
          : requestError?.detail ||
              "Failed to update the post."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (
    loading &&
    !singlePost
  ) {
    return <Loader />;
  }

  if (
    error &&
    !singlePost
  ) {
    return (
      <Message variant="danger">
        {typeof error === "string"
          ? error
          : error?.detail ||
            "Failed to load the post."}
      </Message>
    );
  }

  if (
    !singlePost ||
    String(singlePost.id) !==
      String(id)
  ) {
    return null;
  }

  const totalMediaCount =
    existingMedia.length +
    files.length;

  return (
    <div className="edit-post-wrapper">
      <form
        className="post-card"
        onSubmit={handleSubmit}
      >
        <h2>Edit Post</h2>

        {updateError && (
          <Message variant="danger">
            {updateError}
          </Message>
        )}

        {isUpdating && <Loader />}

        <input
          className="post-title"
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value
            )
          }
          placeholder="Post title"
          disabled={isUpdating}
          required
        />

        <PostEditor
          ref={editorRef}
          initialContent={
            singlePost.content
          }
          onChange={setContent}
        />

        <div className="editor-toolbar">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={
              isUpdating ||
              totalMediaCount >=
                MAX_FILES
            }
          >
            🖼️
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,video/mp4"
            multiple
            hidden
            onChange={
              handleFileUpload
            }
          />

          <span className="media-count">
            {totalMediaCount}/
            {MAX_FILES}
          </span>
        </div>

        {existingMedia.length > 0 && (
          <div className="media-previews">
            {existingMedia.map(
              (media) => {
                const mediaType =
                  getExistingMediaType(
                    media
                  );

                return (
                  <div
                    key={media.id}
                    className="media-preview-item"
                  >
                    {mediaType ===
                    "video" ? (
                      <video
                        src={
                          media.file
                        }
                        controls
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={
                          media.file
                        }
                        alt="Existing post media"
                      />
                    )}

                    <button
                      type="button"
                      className="remove-media-btn"
                      onClick={() =>
                        removeExistingMedia(
                          media.id
                        )
                      }
                      disabled={
                        isUpdating
                      }
                      aria-label="Remove existing media"
                    >
                      ×
                    </button>
                  </div>
                );
              }
            )}
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
                  <NewMediaPreview
                    file={file}
                  />

                  <button
                    type="button"
                    className="remove-media-btn"
                    onClick={() =>
                      removeNewFile(
                        index
                      )
                    }
                    disabled={
                      isUpdating
                    }
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
          disabled={isUpdating}
        >
          {isUpdating
            ? "Updating..."
            : "Update Post"}
        </button>
      </form>
    </div>
  );
};

export default EditPost;