"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  saveAboutSection,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  createSlide,
  updateSlide,
  deleteSlide,
  updateSlideOrder,
} from "@/app/dashboard/admin/landing-page/actions"
import { Megaphone, Image as ImageIcon, FileText, Quote, BarChart3, ChevronUp, ChevronDown } from "lucide-react"
import { SlideImageUpload } from "@/components/slide-image-upload"

type TabId = "announcements" | "hero" | "about" | "testimonials" | "stats"

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "hero", label: "Hero Slides", icon: ImageIcon },
  { id: "about", label: "About Section", icon: FileText },
  { id: "testimonials", label: "Testimonials", icon: Quote },
  { id: "stats", label: "Statistics", icon: BarChart3 },
]

interface LandingPageAdminTabsProps {
  announcements: any[]
  slides: any[]
  about: any
  testimonials: any[]
  platformStats: any[]
}

export function LandingPageAdminTabs({
  announcements,
  slides,
  about,
  testimonials,
  platformStats,
}: LandingPageAdminTabsProps) {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>("announcements")
  const [message, setMessage] = useState<string | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<string | null>(null)
  const [editingSlide, setEditingSlide] = useState<string | null>(null)

  const showMsg = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-deep-teal/20 pb-4">
        {TABS.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={tab === id ? "default" : "outline"}
            size="sm"
            className={tab === id ? "bg-deep-teal" : ""}
            onClick={() => setTab(id)}
          >
            <Icon className="h-4 w-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>

      {message && (
        <div className="rounded-lg bg-success-green/20 text-success-green px-4 py-2 text-sm">
          {message}
        </div>
      )}

      {tab === "announcements" && (
        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <p className="text-sm text-slate-500">Banner at top of landing page. One active shown at a time.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {announcements.map((a: any) => (
              <div key={a.id} className="rounded-lg border p-4 space-y-3">
                {editingAnnouncement === a.id ? (
                  <form
                    action={async (fd) => {
                      const r = await updateAnnouncement(a.id, fd)
                      if (r.error) showMsg(r.error)
                      else {
                        setEditingAnnouncement(null)
                        showMsg("Updated.")
                      }
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <Label>Title</Label>
                      <Input name="title" defaultValue={a.title} className="mt-1" />
                    </div>
                    <div>
                      <Label>Content</Label>
                      <Textarea name="content" defaultValue={a.content} rows={2} className="mt-1" />
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <Label>Background color</Label>
                        <Input name="background_color" type="color" defaultValue={a.background_color || "#3b82f6"} className="mt-1 h-10 w-20 p-1" />
                      </div>
                      <div>
                        <Label>Text color</Label>
                        <Input name="text_color" type="color" defaultValue={a.text_color || "#ffffff"} className="mt-1 h-10 w-20 p-1" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="is_active" defaultChecked={a.is_active} />
                      <span className="text-sm">Active</span>
                    </label>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">Save</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditingAnnouncement(null)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <p className="text-sm text-slate-500">{a.content}</p>
                        <span className={`text-xs px-2 py-0.5 rounded mt-2 inline-block ${a.is_active ? "bg-success-green/20 text-success-green" : "bg-slate-200"}`}>
                          {a.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingAnnouncement(a.id)}>Edit</Button>
                        <form action={async () => { await deleteAnnouncement(a.id) }} className="inline">
                          <Button type="submit" size="sm" variant="outline" className="text-error-red border-error-red/50">Delete</Button>
                        </form>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
            <form
              action={async (fd) => {
                const r = await createAnnouncement(fd)
                if (r.error) showMsg(r.error)
                else showMsg("Announcement created.")
              }}
              className="rounded-lg border border-dashed p-4 space-y-3"
            >
              <p className="font-medium text-deep-teal">+ New Announcement</p>
              <div>
                <Label>Title</Label>
                <Input name="title" placeholder="e.g. New courses!" className="mt-1" />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea name="content" placeholder="Message text" rows={2} className="mt-1" />
              </div>
              <div className="flex gap-4">
                <div>
                  <Label>Background</Label>
                  <Input name="background_color" type="color" defaultValue="#3b82f6" className="mt-1 h-10 w-20 p-1" />
                </div>
                <div>
                  <Label>Text color</Label>
                  <Input name="text_color" type="color" defaultValue="#ffffff" className="mt-1 h-10 w-20 p-1" />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" name="is_active" defaultChecked />
                <span className="text-sm">Active</span>
              </label>
              <Button type="submit" size="sm">Create</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === "hero" && (
        <Card>
          <CardHeader>
            <CardTitle>Hero Slides</CardTitle>
            <p className="text-sm text-slate-500">
              These images appear <strong>next to the About section</strong> on the homepage. Add slides for a rotating carousel. Set <strong>Order</strong> (1 = first) and click Save to reorder.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {slides.length === 0 && (
              <p className="text-sm text-slate-500 rounded-lg border border-dashed border-deep-teal/20 p-4 bg-deep-teal/5">
                No slides yet. Add one below to show images next to the About section.
              </p>
            )}
            {slides.map((s: any) => (
              <div key={s.id} className="rounded-xl border border-deep-teal/20 overflow-hidden bg-white">
                {editingSlide === s.id ? (
                  <form
                    action={async (fd) => {
                      const r = await updateSlide(s.id, fd)
                      if (r.error) showMsg(r.error)
                      else {
                        setEditingSlide(null)
                        showMsg("Slide updated.")
                      }
                    }}
                    className="p-6 space-y-6"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <p className="text-sm font-medium text-deep-teal border-b border-deep-teal/20 pb-1">Content</p>
                        <div>
                          <Label>Title</Label>
                          <Input name="title" defaultValue={s.title} className="mt-1 rounded-xl" placeholder="Slide title" />
                        </div>
                        <div>
                          <Label>Description (optional)</Label>
                          <Textarea name="description" defaultValue={s.description || ""} rows={2} className="mt-1 rounded-xl" />
                        </div>
                        <div>
                          <Label>Button text (CTA)</Label>
                          <Input name="cta_text" defaultValue={s.cta_text || ""} className="mt-1 rounded-xl" placeholder="Get Started" />
                        </div>
                        <div>
                          <Label>Button link (optional)</Label>
                          <Input name="cta_link" defaultValue={s.cta_link || ""} className="mt-1 rounded-xl" placeholder="/signup" />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-sm font-medium text-deep-teal border-b border-deep-teal/20 pb-1">Image &amp; settings</p>
                        <div>
                          <Label>Slide image</Label>
                          <SlideImageUpload key={s.id} name="image_url" defaultUrl={s.image_url} className="mt-1" />
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <div>
                            <Label className="text-xs">Display order</Label>
                            <Input name="display_order" type="number" defaultValue={s.display_order} className="mt-1 w-20 rounded-xl" />
                          </div>
                          <label className="flex items-center gap-2 pt-6">
                            <input type="checkbox" name="is_active" defaultChecked={s.is_active} />
                            <span className="text-sm">Active (show on site)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-deep-teal/10">
                      <Button type="submit" size="sm" className="rounded-xl">Save changes</Button>
                      <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => setEditingSlide(null)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-stretch">
                    <div className="w-full sm:w-48 shrink-0 aspect-video sm:aspect-square bg-deep-teal/10">
                      {s.image_url ? (
                        <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <ImageIcon className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-between gap-3">
                      <div>
                        <p className="font-semibold text-deep-teal">{s.title || "Untitled slide"}</p>
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{s.description || "No description"}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${s.is_active ? "bg-success-green/20 text-success-green" : "bg-slate-200 text-slate-600"}`}>
                            {s.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <form
                          action={async (fd) => {
                            const order = parseInt((fd.get("display_order") as string) || "0", 10)
                            const r = await updateSlideOrder(s.id, order)
                            if (r?.error) showMsg(r.error)
                            else { showMsg("Order saved."); router.refresh() }
                          }}
                          className="flex items-center gap-2"
                        >
                          <Label htmlFor={`order-${s.id}`} className="text-xs whitespace-nowrap">Order:</Label>
                          <Input
                            id={`order-${s.id}`}
                            name="display_order"
                            type="number"
                            defaultValue={s.display_order}
                            className="w-16 h-8 text-sm"
                            min={0}
                          />
                          <Button type="submit" size="sm" variant="secondary" className="h-8">Save</Button>
                        </form>
                        <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditingSlide(s.id)}>Edit</Button>
                        <form action={async () => { const r = await deleteSlide(s.id); if (r?.error) showMsg(r.error); else { showMsg("Removed."); router.refresh() } }} className="inline">
                          <Button type="submit" size="sm" variant="outline" className="rounded-lg text-red-600 border-red-200 hover:bg-red-50">Remove</Button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div className="rounded-xl border-2 border-dashed border-deep-teal/30 p-6 bg-deep-teal/5">
              <p className="font-semibold text-deep-teal mb-4">+ Add new slide</p>
              <form
                action={async (fd) => {
                  const r = await createSlide(fd)
                  if (r.error) showMsg(r.error)
                  else showMsg("Slide created.")
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-deep-teal border-b border-deep-teal/20 pb-1">Content</p>
                    <div>
                      <Label>Title</Label>
                      <Input name="title" placeholder="e.g. Welcome to EduPlatform" className="mt-1 rounded-xl" />
                    </div>
                    <div>
                      <Label>Description (optional)</Label>
                      <Textarea name="description" placeholder="Short text on the slide" rows={2} className="mt-1 rounded-xl" />
                    </div>
                    <div>
                      <Label>Button text (CTA)</Label>
                      <Input name="cta_text" placeholder="Get Started" className="mt-1 rounded-xl" />
                    </div>
                    <div>
                      <Label>Button link (optional)</Label>
                      <Input name="cta_link" placeholder="/signup" className="mt-1 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-deep-teal border-b border-deep-teal/20 pb-1">Image &amp; settings</p>
                    <div>
                      <Label>Slide image</Label>
                      <SlideImageUpload name="image_url" className="mt-1" />
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <Label className="text-xs">Display order</Label>
                        <Input name="display_order" type="number" defaultValue={slides.length} className="mt-1 w-20 rounded-xl" />
                      </div>
                      <label className="flex items-center gap-2 pt-6">
                        <input type="checkbox" name="is_active" defaultChecked />
                        <span className="text-sm">Active</span>
                      </label>
                    </div>
                  </div>
                </div>
                <Button type="submit" size="sm" className="rounded-xl">Create slide</Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "about" && (
        <Card>
          <CardHeader>
            <CardTitle>About Section</CardTitle>
            <p className="text-sm text-slate-500">Heading, subheading, vision, mission, content, and image. Stats are synced from Statistics tab.</p>
          </CardHeader>
          <CardContent>
            <form
              action={async (fd) => {
                const r = await saveAboutSection(fd)
                if (r.error) showMsg(r.error)
                else showMsg("About section saved.")
              }}
              className="space-y-4"
            >
              <div>
                <Label>Heading</Label>
                <Input name="heading" defaultValue={about?.heading || "About EduPlatform"} className="mt-1" />
              </div>
              <div>
                <Label>Subheading</Label>
                <Input name="subheading" defaultValue={about?.subheading || ""} className="mt-1" placeholder="Your journey to excellence" />
              </div>
              <div>
                <Label>Content (paragraph)</Label>
                <Textarea name="content" defaultValue={about?.content || ""} rows={4} className="mt-1" />
              </div>
              <div>
                <Label>Vision</Label>
                <Input name="vision" defaultValue={about?.vision || ""} className="mt-1" placeholder="To make quality education accessible" />
              </div>
              <div>
                <Label>Mission</Label>
                <Input name="mission" defaultValue={about?.mission || ""} className="mt-1" placeholder="We connect students with experts" />
              </div>
              <div>
                <Label>About image URL</Label>
                <Input name="image_url" defaultValue={about?.image_url || ""} className="mt-1" placeholder="https://..." />
              </div>
              <Button type="submit">Save About Section</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === "testimonials" && (
        <Card>
          <CardHeader>
            <CardTitle>Testimonials</CardTitle>
            <p className="text-sm text-slate-500">Students can add testimonials after finishing content. New testimonials are shown on the homepage automatically; they cannot be edited or removed here.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {testimonials.map((t: any) => (
              <div key={t.id} className="rounded-lg border p-4">
                <p className="font-medium">{t.student_name}</p>
                <p className="text-sm text-slate-500">{t.student_role_or_course}</p>
                <p className="mt-2 text-slate-600">&ldquo;{t.quote}&rdquo;</p>
                <span className="text-xs text-slate-400 mt-2 inline-block">Rating: {t.rating}</span>
              </div>
            ))}
            {testimonials.length === 0 && (
              <p className="text-sm text-slate-500">No testimonials yet. Students will see the option after they complete some course content.</p>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "stats" && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <p className="text-sm text-slate-500">Homepage stats (students, courses, teachers, rating). Synced automatically when you open this page.</p>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-slate-600 mb-2">Current stats (shown on homepage):</p>
              <ul className="space-y-1 text-sm">
                {platformStats.map((s: any) => (
                  <li key={s.stat_key}>
                    <span className="font-medium">{s.stat_label ?? s.stat_key}:</span> {s.stat_value}
                  </li>
                ))}
                {platformStats.length === 0 && <li className="text-slate-500">No stats yet. They will populate from live data when you load this page.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
