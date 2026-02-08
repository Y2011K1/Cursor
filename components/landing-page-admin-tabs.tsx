"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  refreshPlatformStats,
  saveAboutSection,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  createSlide,
  updateSlide,
  deleteSlide,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "@/app/dashboard/admin/landing-page/actions"
import { Megaphone, Image as ImageIcon, FileText, Quote, BarChart3 } from "lucide-react"

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
  const [tab, setTab] = useState<TabId>("announcements")
  const [message, setMessage] = useState<string | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<string | null>(null)
  const [editingSlide, setEditingSlide] = useState<string | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<string | null>(null)

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
            <p className="text-sm text-slate-500">Carousel on the homepage hero. Order by display_order.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {slides.map((s: any) => (
              <div key={s.id} className="rounded-lg border p-4 space-y-3">
                {editingSlide === s.id ? (
                  <form
                    action={async (fd) => {
                      const r = await updateSlide(s.id, fd)
                      if (r.error) showMsg(r.error)
                      else {
                        setEditingSlide(null)
                        showMsg("Updated.")
                      }
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <Label>Title</Label>
                      <Input name="title" defaultValue={s.title} className="mt-1" />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea name="description" defaultValue={s.description || ""} rows={2} className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>CTA text</Label>
                        <Input name="cta_text" defaultValue={s.cta_text || ""} className="mt-1" />
                      </div>
                      <div>
                        <Label>CTA link</Label>
                        <Input name="cta_link" defaultValue={s.cta_link || ""} className="mt-1" placeholder="/signup" />
                      </div>
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input name="image_url" defaultValue={s.image_url || ""} className="mt-1" placeholder="https://..." />
                    </div>
                    <div>
                      <Label>Display order</Label>
                      <Input name="display_order" type="number" defaultValue={s.display_order} className="mt-1 w-24" />
                    </div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="is_active" defaultChecked={s.is_active} />
                      <span className="text-sm">Active</span>
                    </label>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">Save</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditingSlide(null)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{s.title}</p>
                        <p className="text-sm text-slate-500">Order: {s.display_order} • {s.is_active ? "Active" : "Inactive"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingSlide(s.id)}>Edit</Button>
                        <form action={async () => { await deleteSlide(s.id) }} className="inline">
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
                const r = await createSlide(fd)
                if (r.error) showMsg(r.error)
                else showMsg("Slide created.")
              }}
              className="rounded-lg border border-dashed p-4 space-y-3"
            >
              <p className="font-medium text-deep-teal">+ New Slide</p>
              <div>
                <Label>Title</Label>
                <Input name="title" placeholder="Welcome to EduPlatform" className="mt-1" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea name="description" placeholder="Subtitle or short description" rows={2} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>CTA text</Label>
                  <Input name="cta_text" placeholder="Get Started" className="mt-1" />
                </div>
                <div>
                  <Label>CTA link</Label>
                  <Input name="cta_link" placeholder="/signup" className="mt-1" />
                </div>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input name="image_url" placeholder="https://images.unsplash.com/..." className="mt-1" />
              </div>
              <div>
                <Label>Display order</Label>
                <Input name="display_order" type="number" defaultValue={slides.length} className="mt-1 w-24" />
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
            <p className="text-sm text-slate-500">Featured student reviews on the landing page.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {testimonials.map((t: any) => (
              <div key={t.id} className="rounded-lg border p-4 space-y-3">
                {editingTestimonial === t.id ? (
                  <form
                    action={async (fd) => {
                      const r = await updateTestimonial(t.id, fd)
                      if (r.error) showMsg(r.error)
                      else {
                        setEditingTestimonial(null)
                        showMsg("Updated.")
                      }
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <Label>Student name</Label>
                      <Input name="student_name" defaultValue={t.student_name} className="mt-1" />
                    </div>
                    <div>
                      <Label>Role / Course</Label>
                      <Input name="student_role_or_course" defaultValue={t.student_role_or_course || ""} className="mt-1" />
                    </div>
                    <div>
                      <Label>Rating (1-5)</Label>
                      <Input name="rating" type="number" min={1} max={5} defaultValue={t.rating} className="mt-1 w-20" />
                    </div>
                    <div>
                      <Label>Quote</Label>
                      <Textarea name="quote" defaultValue={t.quote} rows={3} className="mt-1" />
                    </div>
                    <div>
                      <Label>Display order</Label>
                      <Input name="display_order" type="number" defaultValue={t.display_order} className="mt-1 w-24" />
                    </div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="is_active" defaultChecked={t.is_active} />
                      <span className="text-sm">Active</span>
                    </label>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">Save</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditingTestimonial(null)}>Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{t.student_name}</p>
                        <p className="text-sm text-slate-500">{t.student_role_or_course}</p>
                        <p className="mt-2 text-slate-600">&ldquo;{t.quote}&rdquo;</p>
                        <span className={`text-xs px-2 py-0.5 rounded mt-2 inline-block ${t.is_active ? "bg-success-green/20 text-success-green" : "bg-slate-200"}`}>
                          {t.is_active ? "Active" : "Inactive"} • Rating: {t.rating}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingTestimonial(t.id)}>Edit</Button>
                        <form action={async () => { await deleteTestimonial(t.id) }} className="inline">
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
                const r = await createTestimonial(fd)
                if (r.error) showMsg(r.error)
                else showMsg("Testimonial created.")
              }}
              className="rounded-lg border border-dashed p-4 space-y-3"
            >
              <p className="font-medium text-deep-teal">+ New Testimonial</p>
              <div>
                <Label>Student name</Label>
                <Input name="student_name" placeholder="Alex M." className="mt-1" />
              </div>
              <div>
                <Label>Role / Course</Label>
                <Input name="student_role_or_course" placeholder="Web Development" className="mt-1" />
              </div>
              <div>
                <Label>Rating (1-5)</Label>
                <Input name="rating" type="number" min={1} max={5} defaultValue={5} className="mt-1 w-20" />
              </div>
              <div>
                <Label>Quote</Label>
                <Textarea name="quote" placeholder="Structured lessons and clear explanations..." rows={3} className="mt-1" />
              </div>
              <div>
                <Label>Display order</Label>
                <Input name="display_order" type="number" defaultValue={testimonials.length} className="mt-1 w-24" />
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

      {tab === "stats" && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <p className="text-sm text-slate-500">Homepage stats (students, courses, teachers, rating). Auto-sync from database.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action={async () => {
                const r = await refreshPlatformStats()
                if (r.error) showMsg(r.error)
                else showMsg("Stats refreshed from database.")
              }}
            >
              <Button type="submit">Auto-sync stats from database</Button>
            </form>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-slate-600 mb-2">Current platform_stats table (and about_section numbers):</p>
              <ul className="space-y-1 text-sm">
                {platformStats.map((s: any) => (
                  <li key={s.stat_key}>
                    <span className="font-medium">{s.stat_label ?? s.stat_key}:</span> {s.stat_value}
                  </li>
                ))}
                {platformStats.length === 0 && <li className="text-slate-500">No stats yet. Click Auto-sync to populate from live data.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
