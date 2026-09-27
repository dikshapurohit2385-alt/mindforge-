"""
Generate a beautiful, vibrant, child-and-student-friendly PDF instructions guide
with rich visual flowcharts and diagrams for the OnePath AI adaptive learning platform.
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    Image as RLImage
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

# Ensure diagram assets exist before compiling PDF
current_dir = os.path.dirname(os.path.abspath(__file__))
assets_dir = os.path.join(current_dir, "assets")

try:
    import generate_diagrams
    print("Generating fresh visual diagrams...")
    generate_diagrams.create_flow_daily_journey()
    generate_diagrams.create_visual_study_space()
    generate_diagrams.create_flow_diagnostic_level()
    generate_diagrams.create_flow_flashcard_cycle()
    generate_diagrams.create_flow_ask_teacher_catchup()
    generate_diagrams.create_visual_daily_checklist()
    print("Visual diagrams ready.")
except Exception as e:
    print(f"Diagram generation note: {e}")

# ----------------------------------------------------------------------
# Numbered Canvas for "Page X of Y" and Running Header/Footer
# ----------------------------------------------------------------------
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        page_num = self._pageNumber
        
        # Running Top Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0284C7")) # Sky 600
        self.drawString(40, 762, "ONEPATH AI")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B")) # Slate 500
        self.drawString(100, 762, "--  Student Quickstart & Visual Adventure Guide")
        
        # Top Rule
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.8)
        self.line(40, 755, 572, 755)

        # Running Bottom Footer
        self.line(40, 36, 572, 36)
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0284C7"))
        self.drawString(40, 24, "OnePath AI Studio")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(122, 24, "-- One curriculum. Adaptive paths to understanding.")
        
        # Right aligned page number
        page_str = f"Page {page_num} of {total_pages}"
        self.drawRightString(572, 24, page_str)
        
        self.restoreState()


# ----------------------------------------------------------------------
# PDF Generator Logic
# ----------------------------------------------------------------------
def build_student_guide_pdf(output_paths):
    # Palette
    c_primary = colors.HexColor("#1E3A8A")   # Royal Blue
    c_sky = colors.HexColor("#0284C7")       # Sky 600
    c_sky_dark = colors.HexColor("#0369A1")  # Sky 700
    c_sky_light = colors.HexColor("#E0F2FE") # Sky 100
    c_dark = colors.HexColor("#0F172A")      # Slate 900
    c_text = colors.HexColor("#334155")      # Slate 700
    c_green = colors.HexColor("#059669")     # Emerald 600
    c_green_light = colors.HexColor("#ECFDF5")# Emerald 50
    c_amber = colors.HexColor("#D97706")     # Amber 600
    c_amber_light = colors.HexColor("#FFFBEB")# Amber 50
    c_purple = colors.HexColor("#7C3AED")    # Violet 600
    c_purple_light = colors.HexColor("#F5F3FF")# Violet 50
    c_border = colors.HexColor("#CBD5E1")    # Slate 300

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_primary,
        alignment=TA_LEFT,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=c_sky,
        alignment=TA_LEFT,
        spaceAfter=5
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12.5,
        leading=16,
        textColor=c_primary,
        spaceBefore=6,
        spaceAfter=3
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=c_sky_dark,
        spaceBefore=0,
        spaceAfter=0
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=c_text,
        spaceAfter=2.5
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_text,
        leftIndent=11,
        firstLineIndent=-7,
        spaceAfter=2
    )

    tip_style = ParagraphStyle(
        'TipText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#1E293B")
    )

    badge_style = ParagraphStyle(
        'BadgeText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.5,
        leading=8.5,
        textColor=colors.white,
        alignment=TA_CENTER
    )

    pill_style = ParagraphStyle(
        'PillText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.5,
        leading=8.5,
        textColor=colors.white,
        alignment=TA_CENTER
    )

    card_header = ParagraphStyle(
        'CardHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=c_dark
    )

    def create_callout_box(badge_text, title, text, bg_color, border_color, badge_bg=c_amber):
        pill = Table([[Paragraph(badge_text, pill_style)]], colWidths=[70], rowHeights=[14])
        pill.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), badge_bg),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
            ('TOPPADDING', (0,0), (-1,-1), 1),
        ]))

        header_tbl = Table([[pill, Paragraph(f"<b>{title}</b>", card_header)]], colWidths=[76, 446])
        header_tbl.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))

        content = [
            header_tbl,
            Spacer(1, 2),
            Paragraph(text, tip_style)
        ]
        t = Table([[content]], colWidths=[532])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_color),
            ('BOX', (0,0), (-1,-1), 1, border_color),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        return t

    def create_step_card(step_num, title, description, details_list=None, bg_color=colors.HexColor("#F8FAFC"), border_color=colors.HexColor("#E2E8F0"), badge_color=c_sky):
        badge = Table([[Paragraph(f"STEP {step_num}", badge_style)]], colWidths=[46], rowHeights=[14])
        badge.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), badge_color),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
            ('TOPPADDING', (0,0), (-1,-1), 1),
        ]))

        header_table = Table([[badge, Paragraph(f"<b>{title}</b>", h2_style)]], colWidths=[52, 470])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ]))

        inner_items = [
            header_table,
            Spacer(1, 2),
            Paragraph(description, body_style)
        ]

        if details_list:
            for item in details_list:
                inner_items.append(Paragraph(f"&bull; <b>{item[0]}</b>: {item[1]}", bullet_style))

        wrapper = Table([[inner_items]], colWidths=[532])
        wrapper.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_color),
            ('BOX', (0,0), (-1,-1), 1, border_color),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        return wrapper

    story = []

    # =========================================================================
    # PAGE 1: WELCOME & DASHBOARD (MISSION CONTROL) + FLOWCHART 1
    # =========================================================================
    hero_title = Paragraph("OnePath AI -- Student Adventure Guide", title_style)
    hero_sub = Paragraph("Learn Smarter, Master Every Concept & Have Fun with Your AI Study Companion!", subtitle_style)
    
    banner_intro = Paragraph(
        "<b>Welcome, Student Explorer!</b> OnePath AI (MindForge) is your smart personal study companion designed specifically for school. It adapts to <b>how you learn</b>: visual diagrams, real-world examples, or testing yourself with quick quizzes. Follow this visual roadmap to explore every feature!",
        body_style
    )

    hero_box = Table([[hero_title], [hero_sub], [banner_intro]], colWidths=[532])
    hero_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#93C5FD")),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(hero_box)
    story.append(Spacer(1, 6))

    # Flowchart 1: Daily Learning Adventure
    flow1_path = os.path.join(assets_dir, "flow_daily_journey.png")
    if os.path.exists(flow1_path):
        story.append(RLImage(flow1_path, width=532, height=105))
        story.append(Spacer(1, 6))

    story.append(Paragraph("Chapter 1: Getting Started & Your Student Dashboard", h1_style))
    story.append(Paragraph(
        "Your Dashboard is your <b>Academic Mission Control</b> where you see your classes, subjects, streaks, and recommendations.",
        body_style
    ))

    # Step 1: Login
    story.append(create_step_card(
        1,
        "Logging In with Your School Account",
        "Open your browser and visit the OnePath AI portal. Sign in using your registered school email and password.",
        [
            ("Select Role", "Make sure 'Student' is selected upon sign-in so you access student features."),
            ("First-Time Setup", "If your teacher gave you a demo account (e.g. Alex Chen or Bhavya Rathore), enter it to jump right in."),
            ("Keep It Safe", "Never share your password with other students. Your notes and progress are unique to you!")
        ]
    ))
    story.append(Spacer(1, 5))

    # Step 2: Dashboard Overview
    story.append(create_step_card(
        2,
        "Understanding Your Dashboard Screen",
        "Take a quick look around your home screen. Here are the 4 key things you will see:",
        [
            ("Your Profile & Class Badge", "Look at the top-right header! See your assigned Class and current Knowledge Level."),
            ("Continue Learning Banner", "Tap <b>'Start Learning'</b> on the top dark card to resume where you stopped yesterday!"),
            ("Enrolled Subjects Cards", "Shows Science, Mathematics, English, etc. with chapter progress meters."),
            ("Attendance & Daily Streak", "Shows your attendance percentage and study days. Keep your streak active!")
        ]
    ))
    story.append(Spacer(1, 5))

    story.append(create_callout_box(
        "PRO TIP",
        "Personalized Progress Saved Automatically!",
        "OnePath AI remembers your pace. If you take a break or close your browser, your reading spot and notes are always saved automatically!",
        c_amber_light,
        colors.HexColor("#FCD34D"),
        c_amber
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: STUDY SPACE & ADAPTIVE LESSONS + VISUAL 2
    # =========================================================================
    story.append(Paragraph("Chapter 2: The Study Space (Your Digital Interactive Classroom)", h1_style))
    story.append(Paragraph(
        "The <b>Study Space</b> is where the real learning happens! Instead of plain text, OnePath AI breaks each chapter into interactive lessons with visuals, diagrams, and quick checkups.",
        body_style
    ))

    # Visual 2: Study Space Screen Mockup
    visual2_path = os.path.join(assets_dir, "visual_study_space.png")
    if os.path.exists(visual2_path):
        story.append(RLImage(visual2_path, width=532, height=105))
        story.append(Spacer(1, 6))

    story.append(create_step_card(
        3,
        "Entering the Study Space Library",
        "Click on <b>'Study Space'</b> in the left sidebar menu (or click any chapter from your subjects page).",
        [
            ("Filter by Subject", "Click on the subject tags (e.g. Science, Mathematics) to filter chapters quickly."),
            ("Search Bar", "Looking for 'Photosynthesis' or 'Linear Equations'? Type in the search box to find that chapter instantly!"),
            ("Chapter Status", "See which chapters are Unlocked and ready to explore.")
        ]
    ))
    story.append(Spacer(1, 5))

    story.append(create_step_card(
        4,
        "Reading Interactive Lessons with Your Learning Style",
        "Once you open a chapter lesson, notice how the explanation is written specifically for your level:",
        [
            ("Plain Language & Real-World Examples", "Concepts are explained using sports, games, cooking, and everyday life analogies."),
            ("Visual Diagrams & Flowcharts", "Interactive diagrams show biological cycles, chemical reactions, or math steps with arrows."),
            ("Smart Text Highlighting", "Drag your mouse over any sentence to highlight key points in bright yellow or green!"),
            ("Quick Concept Checks", "Answer the 1-question mini challenge at the bottom of each section for instant feedback!")
        ]
    ))
    story.append(Spacer(1, 5))

    story.append(create_step_card(
        5,
        "Taking Lesson Notes Directly Inside the Lesson",
        "Don't reach for a separate paper notebook! At the bottom of every lesson is the built-in <b>Lesson Notes Editor</b>.",
        [
            ("Type Key Definitions", "Jot down formulas or teacher hints while the lesson is right in front of you."),
            ("Click 'Save Note'", "Your notes are permanently saved to your account and automatically linked to that chapter!"),
            ("Access Anywhere", "You can also view, edit, and search these notes later in your full Digital Notebook.")
        ],
        c_green_light,
        colors.HexColor("#A7F3D0"),
        c_green
    ))
    story.append(Spacer(1, 5))

    story.append(create_callout_box(
        "DID YOU KNOW?",
        "Visual Diagrams Help You Remember 65% More Information!",
        "When studying a new chapter, spend 30 seconds examining the visual diagram before reading the text. Your brain builds a mental map that makes formulas easy to recall!",
        c_purple_light,
        colors.HexColor("#DDD6FE"),
        c_purple
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: DIAGNOSTIC ASSESSMENT & LEARNING PATH + FLOWCHART 3
    # =========================================================================
    story.append(Paragraph("Chapter 3: Diagnostic Assessments & Your Learning Path", h1_style))
    story.append(Paragraph(
        "How does OnePath AI know what you need help with? Through the <b>Diagnostic Assessment</b> and your <b>Adaptive Learning Roadmap</b>.",
        body_style
    ))

    # Flowchart 3: Diagnostic test to Custom Path
    flow3_path = os.path.join(assets_dir, "flow_diagnostic_level.png")
    if os.path.exists(flow3_path):
        story.append(RLImage(flow3_path, width=532, height=108))
        story.append(Spacer(1, 6))

    story.append(create_step_card(
        6,
        "Taking a Diagnostic Assessment (No Pressure!)",
        "Whenever you start a new subject or chapter, you might see an invitation to take a quick diagnostic checkup.",
        [
            ("It is NOT an Exam!", "There are NO negative marks, NO report cards, and NO stress. It is simply a friendly check."),
            ("How it Works", "Answer 5 to 10 quick questions. If you don't know an answer, don't worry--just pick your best guess."),
            ("Your Superpower Profile", "MindForge detects whether you learn best with Visual explanations, Step-by-Step, or Real-world stories."),
            ("Customized Difficulty", "If you already know the basics, MindForge jumps straight into exciting, advanced challenges.")
        ]
    ))
    story.append(Spacer(1, 5))

    story.append(create_step_card(
        7,
        "Exploring Your Adaptive Learning Path & Knowledge Graph",
        "Click on <b>'Adaptive Learning Path'</b> in the sidebar to see your interactive journey map.",
        [
            ("Step-by-Step Roadmap", "Mastered topics turn bright green with checkmarks, while upcoming topics show what's next."),
            ("Prerequisites Alert [LOCKED]", "Ever wonder why a topic is locked? Click the lock icon to see what foundation you need first!"),
            ("Interactive Knowledge Graph", "Click <b>'Graph View'</b> to see a constellation of circles showing how concepts connect!")
        ]
    ))
    story.append(Spacer(1, 5))

    # Feature comparison table
    path_table_data = [
        [
            Paragraph("<b>Knowledge Level</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
            Paragraph("<b>What it Means</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
            Paragraph("<b>How OnePath AI Helps You</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white))
        ],
        [
            Paragraph("<b>Foundational</b>", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7, textColor=c_primary)),
            Paragraph("Building core basics and definitions.", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text)),
            Paragraph("Provides simplified explanations, extra diagrams, and friendly analogies.", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text))
        ],
        [
            Paragraph("<b>Intermediate</b>", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7, textColor=colors.HexColor("#0284C7"))),
            Paragraph("Good grasp of concepts, practicing problems.", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text)),
            Paragraph("Balanced mix of concept deep-dives, formulas, and tricky quiz challenges.", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text))
        ],
        [
            Paragraph("<b>Advanced</b>", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7, textColor=c_purple)),
            Paragraph("Mastered curriculum, ready for deep thinking.", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text)),
            Paragraph("Offers Olympiad-style challenges, deeper inquiries, and speed drills.", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text))
        ]
    ]
    path_table = Table(path_table_data, colWidths=[90, 175, 267])
    path_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(path_table)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: PRACTICE POWERHOUSE — QUIZZES & FLASHCARDS + FLOWCHART 4
    # =========================================================================
    story.append(Paragraph("Chapter 4: Practice Powerhouse -- Quizzes & Flashcards", h1_style))
    story.append(Paragraph(
        "Practice is how good students become great students! OnePath AI provides two exciting practice tools: <b>Interactive Quizzes</b> and <b>Spaced-Repetition Flashcards</b>.",
        body_style
    ))

    # Flowchart 4: Flashcard Spaced Repetition Cycle
    flow4_path = os.path.join(assets_dir, "flow_flashcard_cycle.png")
    if os.path.exists(flow4_path):
        story.append(RLImage(flow4_path, width=532, height=105))
        story.append(Spacer(1, 6))

    story.append(create_step_card(
        8,
        "Taking Quizzes & Leveling Up Your Score",
        "Click on <b>'Quizzes & Practice'</b> in the left sidebar to start a challenge.",
        [
            ("Choose Your Subject & Chapter", "Pick what you want to practice today--from Force & Motion to Cell Biology."),
            ("Answer at Your Own Pace", "Read each question carefully and select your option. There is no scary countdown timer!"),
            ("Detailed Answer Review", "OnePath AI explains <b>why</b> each option was right or wrong so you learn from mistakes."),
            ("Earn Mastery Points", "High scores boost your topic mastery from 20% all the way up to 100%!")
        ]
    ))
    story.append(Spacer(1, 5))

    story.append(create_step_card(
        9,
        "Flashcards & Spaced Repetition (The Memory Secret!)",
        "Click on <b>'Flashcards & Revision'</b> in the sidebar. This is the secret weapon used by top students worldwide!",
        [
            ("How Flashcards Work", "See a card with a question or formula. Say the answer in your head, then tap <b>'Flip Card'</b>!"),
            ("Rate Your Recall", "Tap <b>'Hard'</b>, <b>'Good'</b>, or <b>'Easy'</b> depending on how well you knew it."),
            ("What is Spaced Repetition?", "Our smart algorithm calculates the exact time your brain starts to forget, and schedules that card right then!"),
            ("Zero Cramming Before Exams", "Reviewing 10 flashcards a day locks vocabulary into long-term memory permanently!")
        ],
        c_purple_light,
        colors.HexColor("#DDD6FE"),
        c_purple
    ))
    story.append(Spacer(1, 5))

    # Flashcard Buttons Guide Table
    flash_tbl_data = [
        [
            Paragraph("<b>Button Option</b>", ParagraphStyle('FTH1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
            Paragraph("<b>When to Tap It</b>", ParagraphStyle('FTH1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
            Paragraph("<b>What the AI Does Next</b>", ParagraphStyle('FTH1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white))
        ],
        [
            Paragraph("<b>HARD</b>", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7, textColor=colors.HexColor("#EF4444"))),
            Paragraph("Couldn't remember or got it wrong.", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text)),
            Paragraph("Shows this card again tomorrow so it sticks in your brain.", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text))
        ],
        [
            Paragraph("<b>GOOD</b>", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7, textColor=c_sky)),
            Paragraph("Remembered after thinking a bit.", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text)),
            Paragraph("Schedules it 3 to 4 days later to reinforce recall.", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text))
        ],
        [
            Paragraph("<b>EASY</b>", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7, textColor=c_green)),
            Paragraph("Knew it immediately without pausing.", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text)),
            Paragraph("Pushes it 1 to 2 weeks out. You've officially mastered it!", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text))
        ]
    ]
    flash_table = Table(flash_tbl_data, colWidths=[80, 185, 267])
    flash_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#6D28D9")),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(flash_table)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: NOTEBOOK, ASK TEACHER & ATTENDANCE CATCH-UP + FLOWCHART 5
    # =========================================================================
    story.append(Paragraph("Chapter 5: Digital Notebook, Ask Teacher & Catch-Up", h1_style))
    story.append(Paragraph(
        "School life can get busy! Here are three essential tools that make sure you stay organized, get your questions answered, and never fall behind.",
        body_style
    ))

    # Flowchart 5: Ask Teacher & Attendance Catch-Up
    flow5_path = os.path.join(assets_dir, "flow_ask_teacher_catchup.png")
    if os.path.exists(flow5_path):
        story.append(RLImage(flow5_path, width=532, height=108))
        story.append(Spacer(1, 6))

    story.append(create_step_card(
        10,
        "Your Digital Notebook (All Notes in One Place)",
        "Click on <b>'Digital Notebook'</b> in the sidebar to open your personal cloud diary.",
        [
            ("Color-Coded & Tagged", "Organize notes by subject (Science, Math, Social Studies) or chapter."),
            ("Lightning-Fast Search", "Type any keyword into the search bar to pull up notes before a test."),
            ("Safe in the Cloud", "No lost paper notebooks, crumpled pages, or dog-eared binders!")
        ]
    ))
    story.append(Spacer(1, 5))

    story.append(create_step_card(
        11,
        "Ask Teacher -- Never Stay Stuck on a Doubt!",
        "Confused by a difficult homework problem or textbook question? Use the <b>Ask Teacher</b> portal.",
        [
            ("Select Subject & Chapter", "Pick the subject and chapter related to your doubt."),
            ("Type Your Question", "Explain what you find confusing. You can also paste textbook text into the context box."),
            ("Verified Solution", "Your teacher receives your question and writes back with step-by-step guidance!")
        ]
    ))
    story.append(Spacer(1, 5))

    story.append(create_step_card(
        12,
        "Missed a Class? Attendance Catch-Up to the Rescue!",
        "Were you sick, traveling, or had an emergency? OnePath AI makes sure you never fall behind your classmates!",
        [
            ("Automatic Detection", "On your Dashboard, look at your Attendance card. If you missed a class, a <b>'Catch Up'</b> button appears."),
            ("Personalized AI Catch-Up Path", "Clicking 'Catch Up' compiles a concentrated summary of what the teacher taught that day!"),
            ("Quick Practice Check", "Gives you 2 or 3 quick recap exercises so you are ready for class tomorrow.")
        ],
        c_green_light,
        colors.HexColor("#A7F3D0"),
        c_green
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: STUDENT SUCCESS TOOLKIT & FAQ + VISUAL 6
    # =========================================================================
    story.append(Paragraph("Chapter 6: Student Success Habits & FAQ", h1_style))
    story.append(Paragraph(
        "Here is your easy daily routine and answers to the most common questions students ask about OnePath AI.",
        body_style
    ))

    # Visual 6: Daily Checklist Roadmap
    visual6_path = os.path.join(assets_dir, "visual_daily_checklist.png")
    if os.path.exists(visual6_path):
        story.append(RLImage(visual6_path, width=532, height=98))
        story.append(Spacer(1, 6))

    story.append(create_step_card(
        13,
        "The 15-Minute Daily Student Success Habit",
        "Follow this simple 5-step checklist every study day to stay at the top of your class with zero stress:",
        [
            ("1. Morning Check-in", "Log in and check your Dashboard. See your streak and read your recommended next action."),
            ("2. Complete 1 Lesson", "Read through the interactive lesson, inspect the visual diagram, and answer the Quick Concept Check."),
            ("3. Practice 5 Flashcards", "Flip cards to refresh memory on key terms and formulas."),
            ("4. Add 1 Note", "Write down one new fact or formula you learned today into your Digital Notebook."),
            ("5. Clear Doubts Early", "If anything was tricky, send a doubt via 'Ask Teacher' right away instead of waiting until exam week!")
        ],
        colors.HexColor("#FFFBEB"),
        colors.HexColor("#FCD34D"),
        c_amber
    ))
    story.append(Spacer(1, 5))

    story.append(Paragraph("Frequently Asked Questions (FAQ)", h1_style))

    faq_data = [
        [
            Paragraph("<b>Question</b>", ParagraphStyle('FTH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white)),
            Paragraph("<b>Friendly Answer</b>", ParagraphStyle('FTH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.white))
        ],
        [
            Paragraph("<b>Will I lose marks if I make mistakes?</b>", ParagraphStyle('FQ', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7, textColor=c_primary)),
            Paragraph("Never! In OnePath AI, mistakes are just clues that help the AI teach you better. Practice quizzes and diagnostics never reduce your school grade.", ParagraphStyle('FA', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text))
        ],
        [
            Paragraph("<b>Can I use this on my phone or tablet?</b>", ParagraphStyle('FQ', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7, textColor=c_primary)),
            Paragraph("Yes! OnePath AI works smoothly on laptops, desktop computers, iPads, tablets, and smartphones. Just open Chrome, Safari, or Edge.", ParagraphStyle('FA', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text))
        ],
        [
            Paragraph("<b>Can other students see my personal notes?</b>", ParagraphStyle('FQ', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7, textColor=c_primary)),
            Paragraph("No. Your Digital Notebook is 100% private to your account. Only you can view, edit, or delete your personal notes.", ParagraphStyle('FA', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text))
        ],
        [
            Paragraph("<b>Who answers my questions in 'Ask Teacher'?</b>", ParagraphStyle('FQ', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7, textColor=c_primary)),
            Paragraph("Your actual school teacher! When they log into their teacher portal, your question is waiting in their inbox so they can give you personal advice.", ParagraphStyle('FA', parent=styles['Normal'], fontName='Helvetica', fontSize=7, textColor=c_text))
        ]
    ]

    faq_table = Table(faq_data, colWidths=[185, 347])
    faq_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_sky),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(faq_table)
    story.append(Spacer(1, 5))

    # Cheerful Closing Card
    closing_card = Table([[
        Paragraph(
            "<para align='center'><b>You've Got This, Explorer!</b><br/>"
            "Every expert was once a beginner. Take it one chapter at a time, explore with curiosity, "
            "and enjoy your learning adventure with <b>OnePath AI</b>!</para>",
            ParagraphStyle('Closing', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=11.5, textColor=c_primary)
        )
    ]], colWidths=[532])
    closing_card.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#60A5FA")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(closing_card)

    # Build document for each target path
    for target_path in output_paths:
        os.makedirs(os.path.dirname(os.path.abspath(target_path)), exist_ok=True)
        doc = SimpleDocTemplate(
            target_path,
            pagesize=letter,
            leftMargin=40,
            rightMargin=40,
            topMargin=46,
            bottomMargin=42
        )
        doc.build(story, canvasmaker=NumberedCanvas)
        print(f"[Success] Generated PDF at: {target_path}")

if __name__ == "__main__":
    project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))

    targets = [
        os.path.join(project_root, "frontend", "public", "OnePath_AI_Student_Guide.pdf"),
        os.path.join(project_root, "backend", "uploads", "OnePath_AI_Student_Guide.pdf"),
    ]

    build_student_guide_pdf(targets)
