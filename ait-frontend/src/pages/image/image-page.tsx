import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateImage, getImages, deleteImage, describeImage } from "@/actions/image-actions";
import {
  Image as ImageIcon, Wand2, Trash2, Download, Loader2, Sparkles,
  Server, Cpu, Eye, Sliders, Camera, X
} from "lucide-react";
import { toast } from "sonner";
import type { AiImage } from "@/types";
import { formatRelativeTime } from "@/lib/utils";

const MODELS = [
  { id: "flux", label: "⚡ FLUX.1 Turbo (Ultra Fast)", badge: "Fast & Free", icon: Sparkles },
  { id: "flux-realism", label: "📸 FLUX Realism (Photorealistic)", badge: "Photo HQ", icon: ImageIcon },
  { id: "flux-anime", label: "🎨 FLUX Anime (Anime & Manga)", badge: "Anime", icon: Wand2 },
  { id: "sdxl", label: "🌟 Stable Diffusion XL (SDXL)", badge: "SDXL", icon: Cpu },
  { id: "local-sd", label: "💻 Local Stable Diffusion (Automatic1111)", badge: "Local GPU", icon: Server },
  { id: "dall-e-3", label: "🤖 OpenAI DALL-E 3", badge: "OpenAI", icon: Sparkles },
  { id: "dall-e-2", label: "🖼️ OpenAI DALL-E 2", badge: "OpenAI", icon: ImageIcon },
];

const SIZES = [
  { value: "1024x1024", label: "1:1 Square (1024×1024)" },
  { value: "1280x720", label: "16:9 Landscape (1280×720)" },
  { value: "720x1280", label: "9:16 Portrait (720×1280)" },
  { value: "1024x768", label: "4:3 Standard (1024×768)" },
  { value: "768x1024", label: "3:4 Portrait (768×1024)" },
];

const STYLES = [
  { id: "", label: "✨ Natural / None" },
  { id: "photorealistic", label: "📸 Photorealistic" },
  { id: "anime", label: "🎨 Anime" },
  { id: "cinematic", label: "🎬 Cinematic" },
  { id: "cyberpunk", label: "🏙️ Cyberpunk" },
  { id: "3d-render", label: "🧊 3D Render" },
  { id: "fantasy", label: "🐉 Fantasy Art" },
  { id: "pixel-art", label: "👾 Pixel Art" },
  { id: "watercolor", label: "🖌️ Watercolor" },
];

export function ImagePage() {
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("flux");
  const [size, setSize] = useState("1024x1024");
  const [style, setStyle] = useState("");
  const [quality, setQuality] = useState<"standard" | "hd">("standard");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [localEndpoint, setLocalEndpoint] = useState("http://localhost:7860");
  const [refPhoto, setRefPhoto] = useState<string | null>(null);
  const [denoisingStrength, setDenoisingStrength] = useState(0.7);
  const [isDescribing, setIsDescribing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewImage, setPreviewImage] = useState<AiImage | null>(null);

  const { data: imagesData } = useQuery({
    queryKey: ["images"],
    queryFn: getImages,
  });
  const images = imagesData?.success ? (imagesData.data as AiImage[]).filter((i) => i.status === "completed") : [];

  const generate = useMutation({
    mutationFn: () =>
      generateImage({
        prompt,
        model,
        size,
        quality,
        style: style || undefined,
        negativePrompt: negativePrompt || undefined,
        localEndpoint: model === "local-sd" ? localEndpoint : undefined,
        initImage: refPhoto || undefined,
        denoisingStrength: refPhoto ? denoisingStrength : undefined,
      }),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["images"] });
        setPrompt("");
        toast.success("Image generated successfully!");
      } else {
        toast.error(data.message || "Failed to generate image", { duration: 6000 });
      }
    },
    onError: (err: any) => toast.error(err.message || "Failed to generate image", { duration: 6000 }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      if (previewImage) setPreviewImage(null);
      toast.success("Image deleted");
    },
  });

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file is too large (max 10MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setRefPhoto(base64);
        toast.success("Photo attached as reference");
      }
    };
    reader.readAsDataURL(file);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function handleAutoDescribe() {
    if (!refPhoto || isDescribing) return;
    setIsDescribing(true);
    try {
      const res = await describeImage(refPhoto);
      if (res.success && res.data.prompt) {
        setPrompt(res.data.prompt);
        toast.success("Prompt generated from photo with AI!");
      } else {
        toast.error("Failed to describe photo");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to describe photo");
    } finally {
      setIsDescribing(false);
    }
  }

  function handleDownload(url: string, _prompt: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = `ait-image-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: "oklch(0.68 0.22 310)" }}>
              <ImageIcon size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>AI Image Generation</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
            Generate high-resolution AI art with FLUX, Stable Diffusion, DALL-E, or your Local GPU.
          </p>
        </div>
      </div>

      {/* Generator Form */}
      <div className="glass-card p-6 mb-10 rounded-2xl shadow-sm border" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
        <div className="space-y-5">
          {/* Prompt header & actions */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="image-prompt" className="block text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Image Prompt
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="image-ref-photo-input"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary transition-all cursor-pointer font-medium"
                >
                  <Camera size={13} />
                  <span>{refPhoto ? "Change Photo" : "Add Photo / Reference"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const examples = [
                      "A futuristic cybernetic tiger prowling neon Tokyo streets, 8k render",
                      "Cute baby dragon sleeping on a pile of glowing crystals, fantasy art",
                      "Portrait of an astronaut discovering ancient alien artifacts on Mars, cinematic",
                      "A cozy glass treehouse in a mystical glowing forest with fireflies, photorealistic",
                    ];
                    setPrompt(examples[Math.floor(Math.random() * examples.length)]);
                  }}
                  className="text-xs flex items-center gap-1 hover:underline transition-all"
                  style={{ color: "var(--primary)" }}
                >
                  <Sparkles size={12} />
                  Try Example
                </button>
              </div>
            </div>

            {/* Reference Photo Card if attached */}
            {refPhoto && (
              <div className="mb-3 p-3.5 rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 via-black/30 to-transparent flex items-center gap-3.5 animate-fade-in shadow-inner">
                <img
                  src={refPhoto}
                  alt="Reference"
                  className="w-16 h-16 object-cover rounded-lg border border-primary/30 shrink-0 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <span>📷 Photo Edit & Variation Mode</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    Type instructions below (e.g. <em>"add golden frame border"</em>) to edit this photo, or auto-describe it.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleAutoDescribe}
                      disabled={isDescribing}
                      className="text-xs px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-medium flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {isDescribing ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Analyzing with Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 size={12} />
                          <span>Auto-Describe Prompt</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRefPhoto(null)}
                      className="text-xs px-2 py-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-red-400 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <X size={12} />
                      <span>Remove Photo</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <textarea
              id="image-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                refPhoto
                  ? "Describe what you want to change or add to this photo (e.g. 'here add golden frame border', 'make background a sunny beach', 'turn into anime')..."
                  : "Describe what you want to see (e.g. 'A majestic dragon soaring through purple nebula, digital art, 8k resolution')..."
              }
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
              style={{
                background: "var(--input)",
                border: "1px solid var(--input-border)",
                color: "var(--foreground)",
                lineHeight: "1.5",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--input-focus)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
            />

            {/* Quick edit chips if photo is attached */}
            {refPhoto && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-muted-foreground font-medium mr-1">Quick Edits:</span>
                {[
                  "here add golden ornate frame border",
                  "change background to a tropical beach at sunset",
                  "transform into a 3D Pixar animated character style",
                  "convert to vibrant Japanese anime aesthetic",
                  "add cyberpunk neon lights and futuristic atmosphere",
                ].map((editChip, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPrompt(editChip)}
                    className="text-[11px] px-2.5 py-0.5 rounded-full border border-white/10 bg-white/5 hover:bg-primary/20 hover:border-primary/40 text-muted-foreground hover:text-primary transition-all cursor-pointer truncate max-w-xs"
                  >
                    {editChip}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model & Style Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Model */}
            <div>
              <label htmlFor="image-model" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                AI Model / Engine
              </label>
              <select
                id="image-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-medium cursor-pointer"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Size */}
            <div>
              <label htmlFor="image-size" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                Aspect Ratio / Dimensions
              </label>
              <select
                id="image-size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-medium cursor-pointer"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              >
                {SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Style */}
            <div>
              <label htmlFor="image-style" className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground-muted)" }}>
                Art Style Preset
              </label>
              <select
                id="image-style"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-medium cursor-pointer"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              >
                {STYLES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Local SD Specific Settings Banner */}
          {model === "local-sd" && (
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
                <Server size={16} />
                <span>Local Stable Diffusion Configuration</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Connects directly to your local Automatic1111 / SD.Next server running on your GPU.
              </p>
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                  WebUI API Endpoint (e.g. <code>http://localhost:7860</code>)
                </label>
                <input
                  type="text"
                  value={localEndpoint}
                  onChange={(e) => setLocalEndpoint(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-black/40 border border-border outline-none text-foreground font-mono"
                  placeholder="http://localhost:7860"
                />
              </div>
            </div>
          )}

          {/* Advanced Collapsible Options */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
              style={{ color: "var(--foreground-muted)" }}
            >
              <Sliders size={13} />
              <span>{showAdvanced ? "Hide Advanced Options" : "Show Advanced Options (Negative Prompt, Quality)"}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 rounded-xl border space-y-3 animate-fade-in" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>
                    Negative Prompt (Elements to avoid)
                  </label>
                  <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    placeholder="blurry, distorted, ugly, low quality, bad anatomy, deformed"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "var(--input)", border: "1px solid var(--input-border)", color: "var(--foreground)" }}
                  />
                </div>

                {model.startsWith("dall-e") && (
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "var(--foreground-muted)" }}>
                      DALL-E Quality
                    </label>
                    <div className="flex gap-3">
                      {(["standard", "hd"] as const).map((q) => (
                        <label key={q} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="quality"
                            checked={quality === q}
                            onChange={() => setQuality(q)}
                          />
                          <span className="capitalize">{q}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {refPhoto && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold" style={{ color: "var(--foreground-muted)" }}>
                        Reference Photo Influence ({Math.round((1 - denoisingStrength) * 100)}% Original / {Math.round(denoisingStrength * 100)}% New Art)
                      </label>
                      <span className="text-[11px] text-muted-foreground">
                        {denoisingStrength < 0.4 ? "Keep closely to original" : denoisingStrength < 0.75 ? "Balanced transformation" : "Creative redraw"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.95"
                      step="0.05"
                      value={denoisingStrength}
                      onChange={(e) => setDenoisingStrength(parseFloat(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-2">
            <button
              id="generate-image-btn"
              onClick={() => generate.mutate()}
              disabled={!prompt.trim() || generate.isPending}
              className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all shadow-md hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{ background: "oklch(0.68 0.22 310)", color: "white" }}
            >
              {generate.isPending ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>{refPhoto ? "Editing & Generating Art..." : "Generating Art..."}</span>
                </>
              ) : (
                <>
                  <Wand2 size={17} />
                  <span>{refPhoto ? "🎨 Apply Edit & Generate" : "Generate Image"}</span>
                </>
              )}
            </button>
            <span className="text-xs text-muted-foreground">
              {refPhoto
                ? "✨ AI will preserve people/subjects from your photo and apply your edit instructions"
                : model === "local-sd"
                ? "Generates via your local GPU"
                : "Instant generation with FLUX/DALL-E"}
            </span>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <Sparkles size={18} style={{ color: "oklch(0.68 0.22 310)" }} />
              Generated Gallery ({images.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {images.map((img) => (
              <div
                key={img.id}
                className="glass-card overflow-hidden group relative rounded-2xl border shadow-sm transition-all hover:shadow-lg"
                style={{ borderColor: "var(--border)", background: "var(--card)" }}
              >
                <div className="aspect-square overflow-hidden bg-black/20 cursor-pointer" onClick={() => setPreviewImage(img)}>
                  <img
                    src={img.imageUrl!}
                    alt={img.prompt}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Info Bar */}
                <div className="p-3">
                  <p className="text-xs font-medium truncate mb-1" style={{ color: "var(--foreground)" }} title={img.prompt}>
                    {img.prompt}
                  </p>
                  <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--foreground-muted)" }}>
                    <span className="capitalize px-1.5 py-0.5 rounded bg-white/5 font-mono">{img.model}</span>
                    <span>{formatRelativeTime(img.createdAt)}</span>
                  </div>
                </div>

                {/* Hover overlay actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-md">
                  <button
                    onClick={() => setPreviewImage(img)}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-all text-white"
                    title="View Fullscreen"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleDownload(img.imageUrl!, img.prompt)}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-all text-white"
                    title="Download Image"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => remove.mutate(img.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/40 text-red-300 transition-all"
                    title="Delete Image"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && !generate.isPending && (
        <div className="text-center py-20 border border-dashed rounded-3xl" style={{ borderColor: "var(--border)" }}>
          <ImageIcon size={48} className="mx-auto mb-4 opacity-30" style={{ color: "var(--foreground-muted)" }} />
          <h3 className="text-base font-semibold mb-1" style={{ color: "var(--foreground)" }}>No images generated yet</h3>
          <p className="text-xs max-w-sm mx-auto" style={{ color: "var(--foreground-muted)" }}>
            Enter a prompt above and click "Generate Image" to create your first AI masterpiece.
          </p>
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-neutral-800 flex justify-between items-center">
              <div className="flex-1 mr-4">
                <p className="text-sm font-semibold text-white truncate">{previewImage.prompt}</p>
                <p className="text-xs text-neutral-400 capitalize">Model: {previewImage.model} · {previewImage.size}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(previewImage.imageUrl!, previewImage.prompt)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-all"
                >
                  <Download size={13} />
                  Download
                </button>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-400 hover:text-white transition-all"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-black/40">
              <img
                src={previewImage.imageUrl!}
                alt={previewImage.prompt}
                className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
