"""
Generate a beautiful, vibrant, child-and-student-friendly PDF instructions guide
for the OnePath AI (MindForge) adaptive learning platform.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

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
        self.drawString(100, 762, "--  Student Quickstart & Adventure Guide")
        
        # Top Rule
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.8)
        self.line(40, 755, 572, 755)

        # Running Bottom Footer
        self.line(40, 42, 572, 42)
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0284C7"))
        self.drawString(40, 30, "OnePath AI Studio")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(122, 30, "-- One curriculum. Adaptive paths to understanding.")
        
        # Right aligned page number
        page_str = f"Page {page_num} of {total_pages}"
        self.drawRightString(572, 30, page_str)
        
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
        fontSize=20,
        leading=24,
        textColor=c_primary,
        alignment=TA_LEFT,
        spaceAfter=3
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_sky,
        alignment=TA_LEFT,
        spaceAfter=7
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13.5,
        leading=17,
        textColor=c_primary,
        spaceBefore=8,
        spaceAfter=4
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13.5,
        textColor=c_sky_dark,
        spaceBefore=0,
        spaceAfter=0
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_text,
        spaceAfter=3
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=c_text,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.5
    )

    tip_style = ParagraphStyle(
        'TipText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor("#1E293B")
    )

    badge_style = ParagraphStyle(
        'BadgeText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9,
        textColor=colors.white,
        alignment=TA_CENTER
    )

    pill_style = ParagraphStyle(
        'PillText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=9,
        textColor=colors.white,
        alignment=TA_CENTER
    )

    card_header = ParagraphStyle(
        'CardHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=c_dark
    )

    def create_callout_box(badge_text, title, text, bg_color, border_color, badge_bg=c_amber):
        pill = Table([[Paragraph(badge_text, pill_style)]], colWidths=[76], rowHeights=[15])
        pill.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), badge_bg),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
            ('TOPPADDING', (0,0), (-1,-1), 1),
        ]))

        header_tbl = Table([[pill, Paragraph(f"<b>{title}</b>", card_header)]], colWidths=[82, 440])
        header_tbl.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))

        content = [
            header_tbl,
            Spacer(1, 3),
            Paragraph(text, tip_style)
        ]
        t = Table([[content]], colWidths=[532])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_color),
            ('BOX', (0,0), (-1,-1), 1, border_color),
            ('LEFTPADDING', (0,0), (-1,-1), 9),
            ('RIGHTPADDING', (0,0), (-1,-1), 9),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        return t

    def create_step_card(step_num, title, description, details_list=None, bg_color=colors.HexColor("#F8FAFC"), border_color=colors.HexColor("#E2E8F0"), badge_color=c_sky):
        badge = Table([[Paragraph(f"STEP {step_num}", badge_style)]], colWidths=[48], rowHeights=[15])
        badge.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), badge_color),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
            ('TOPPADDING', (0,0), (-1,-1), 1),
        ]))

        header_table = Table([[badge, Paragraph(f"<b>{title}</b>", h2_style)]], colWidths=[54, 468])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ]))

        inner_items = [
            header_table,
            Spacer(1, 2.5),
            Paragraph(description, body_style)
        ]

        if details_list:
            for item in details_list:
                inner_items.append(Paragraph(f"&bull; <b>{item[0]}</b>: {item[1]}", bullet_style))

        wrapper = Table([[inner_items]], colWidths=[532])
        wrapper.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_color),
            ('BOX', (0,0), (-1,-1), 1, border_color),
            ('LEFTPADDING', (0,0), (-1,-1), 9),
            ('RIGHTPADDING', (0,0), (-1,-1), 9),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        return wrapper

    story = []

    # =========================================================================
    # PAGE 1: WELCOME & DASHBOARD (MISSION CONTROL)
    # =========================================================================
    hero_title = Paragraph("OnePath AI -- Student Adventure Guide", title_style)
    hero_sub = Paragraph("Learn Smarter, Master Every Concept & Have Fun with Your AI Study Companion!", subtitle_style)
    
    banner_intro = Paragraph(
        "<b>Welcome, Student Explorer!</b><br/>"
        "OnePath AI (MindForge) is your smart personal study companion designed specifically for school students. "
        "Unlike standard textbooks, OnePath AI adapts to <b>how you learn</b>. Whether you learn best through "
        "interactive diagrams, real-world examples, or testing yourself with quick quizzes, this handbook walks you "
        "through every button, screen, and feature in simple, friendly steps!",
        body_style
    )

    toc_summary = Paragraph(
        "<b>What is Inside This Guide?</b><br/>"
        "&bull; <b>Chapter 1</b>: Getting Started & Dashboard HQ &nbsp;|&nbsp; "
        "<b>Chapter 2</b>: Study Space & Interactive Lessons<br/>"
        "&bull; <b>Chapter 3</b>: Diagnostic Checkup & Learning Roadmap &nbsp;|&nbsp; "
        "<b>Chapter 4</b>: Practice Powerhouse (Quizzes & Flashcards)<br/>"
        "&bull; <b>Chapter 5</b>: Digital Notebook, Ask Teacher & Catch-Up &nbsp;|&nbsp; "
        "<b>Chapter 6</b>: Daily Habits & Student FAQ",
        ParagraphStyle('TOC', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor("#1E3A8A"))
    )

    hero_box = Table([[hero_title], [hero_sub], [banner_intro], [Spacer(1, 2)], [toc_summary]], colWidths=[532])
    hero_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#93C5FD")),
        ('LEFTPADDING', (0,0), (-1,-1), 11),
        ('RIGHTPADDING', (0,0), (-1,-1), 11),
        ('TOPPADDING', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 9),
    ]))
    story.append(hero_box)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Chapter 1: Getting Started & Your Student Dashboard", h1_style))
    story.append(Paragraph(
        "Your Dashboard is your <b>Academic Mission Control</b>. Whenever you log in, this is your home base where you see your classes, subjects, streaks, and recommendations.",
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
            ("Your Profile & Class Badge", "Look at the top-right header! You will see your assigned Class (e.g. Class 9-A) and your current Knowledge Level (Foundational, Intermediate, or Advanced)."),
            ("Continue Learning Banner", "A prominent dark card at the top shows your current topic. Tap <b>'Start Learning'</b> to immediately resume where you stopped yesterday!"),
            ("Enrolled Subjects Cards", "Shows Science, Mathematics, English, etc. Each card lists how many chapters are available and your current completion rate."),
            ("Attendance & Daily Streak", "Shows your attendance percentage and records your active study days. Keeping your streak active helps you build strong learning habits!")
        ]
    ))
    story.append(Spacer(1, 5))

    story.append(create_callout_box(
        "PRO TIP",
        "Personalized Progress Saved Automatically!",
        "OnePath AI remembers your pace. If you take a break or close your browser, your reading spot and notes are always saved automatically. Never worry about losing your work!",
        c_amber_light,
        colors.HexColor("#FCD34D"),
        c_amber
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: STUDY SPACE & ADAPTIVE LESSONS
    # =========================================================================
    story.append(Paragraph("Chapter 2: The Study Space (Your Digital Interactive Classroom)", h1_style))
    story.append(Paragraph(
        "The <b>Study Space</b> is where the real learning happens! Instead of just reading endless blocks of plain text, OnePath AI breaks each chapter into interactive lessons with visuals, diagrams, and quick checkups.",
        body_style
    ))

    story.append(create_step_card(
        3,
        "Entering the Study Space Library",
        "Click on <b>'Study Space'</b> in the left sidebar menu (or click any chapter from your subjects page).",
        [
            ("Filter by Subject", "Click on the subject tags (e.g. Science, Mathematics) to filter chapters quickly."),
            ("Search Bar", "Looking for 'Photosynthesis' or 'Linear Equations'? Type in the search box to find that exact chapter in a split second!"),
            ("Chapter Status", "See which chapters are Unlocked and ready to explore, and which ones have prerequisites.")
        ]
    ))
    story.append(Spacer(1, 5))

    story.append(create_step_card(
        4,
        "Reading Interactive Lessons with Your Learning Style",
        "Once you open a chapter lesson, notice how the explanation is written specifically for your level:",
        [
            ("Plain Language & Real-World Examples", "Complex scientific principles or math problems are explained using analogies like sports, video games, cooking, and everyday life."),
            ("Visual Diagrams & Flowcharts", "Look for the diagram boxes! You will see interactive flowcharts showing biological cycles, chemical reactions, or math steps with arrows."),
            ("Smart Text Highlighting", "Double-click or drag your mouse over any sentence to highlight key points in yellow, blue, or green just like a real textbook marker!"),
            ("Quick Concept Checks", "At the bottom of each section, answer a 1-question mini challenge. It gives you instant encouraging feedback explaining why the answer is right!")
        ]
    ))
    story.append(Spacer(1, 5))

    story.append(create_step_card(
        5,
        "Taking Lesson Notes Directly Inside the Lesson",
        "Don't reach for a separate paper notebook! At the bottom of every lesson is the built-in <b>Lesson Notes Editor</b>.",
        [
            ("Type Key Definitions", "Jot down formulas or teacher hints while the lesson is right in front of you."),
            ("Click 'Save Note'", "Your notes are permanently saved to your account and automatically linked to that exact chapter!"),
            ("Access Anywhere", "You can also view, edit, and search these notes later in your full Digital Notebook.")
        ],
        c_green_light,
        colors.HexColor("#A7F3D0"),
        c_green
    ))
    story.append(Spacer(1, 5))

    # Extra rich toolbar guide for Study Space
    study_tools_data = [
        [
            Paragraph("<b>Study Space Tool</b>", ParagraphStyle('TH1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)),
            Paragraph("<b>Icon / Action</b>", ParagraphStyle('TH1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)),
            Paragraph("<b>How it Helps You Learn</b>", ParagraphStyle('TH1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.white))
        ],
        [
            Paragraph("<b>Visual Diagram</b>", ParagraphStyle('TD1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=c_primary)),
            Paragraph("Flowchart Box", ParagraphStyle('TD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text)),
            Paragraph("Breaks cycles into visual arrows (water cycle, forces, equations).", ParagraphStyle('TD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text))
        ],
        [
            Paragraph("<b>Highlighter</b>", ParagraphStyle('TD1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.HexColor("#0284C7"))),
            Paragraph("Select Text Drag", ParagraphStyle('TD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text)),
            Paragraph("Marks key definitions so you can skim them quickly before exams.", ParagraphStyle('TD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text))
        ],
        [
            Paragraph("<b>Quick Check</b>", ParagraphStyle('TD1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=c_green)),
            Paragraph("Pick Option 1-4", ParagraphStyle('TD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text)),
            Paragraph("Gives instant feedback and hints if you pick the wrong option.", ParagraphStyle('TD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text))
        ]
    ]
    study_table = Table(study_tools_data, colWidths=[110, 110, 312])
    study_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_sky_dark),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(study_table)
    story.append(Spacer(1, 5))

    story.append(create_callout_box(
        "DID YOU KNOW?",
        "Diagrams Help You Remember 65% More Information!",
        "When studying a new science or math chapter, spend 30 seconds examining the visual diagram before reading the text. Your brain builds a mental map that makes formulas and definitions easy to recall!",
        c_purple_light,
        colors.HexColor("#DDD6FE"),
        c_purple
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: DIAGNOSTIC ASSESSMENT & ADAPTIVE LEARNING PATH
    # =========================================================================
    story.append(Paragraph("Chapter 3: Diagnostic Assessments & Your Learning Path", h1_style))
    story.append(Paragraph(
        "How does OnePath AI know what you need help with? Through the <b>Diagnostic Assessment</b> and your <b>Adaptive Learning Roadmap</b>.",
        body_style
    ))

    story.append(create_step_card(
        6,
        "Taking a Diagnostic Assessment (No Pressure!)",
        "Whenever you start a new subject or chapter, you might see an invitation to take a quick diagnostic checkup.",
        [
            ("It is NOT an Exam!", "There are NO negative marks, NO report cards, and NO stress. It is simply a friendly check to see what you already know."),
            ("How it Works", "You answer 5 to 10 quick multiple-choice questions. If you don't know an answer, don't worry--just pick your best guess."),
            ("Your Superpower Profile", "MindForge detects whether you learn best with Visual explanations, Step-by-Step examples, or Real-world stories."),
            ("Customized Difficulty", "If you already know the basics, MindForge won't waste your time! It jumps straight into exciting, advanced challenges.")
        ]
    ))
    story.append(Spacer(1, 5))

    story.append(create_step_card(
        7,
        "Exploring Your Adaptive Learning Path & Knowledge Graph",
        "Click on <b>'Adaptive Learning Path'</b> in the sidebar to see your interactive journey map.",
        [
            ("Step-by-Step Roadmap", "Your curriculum is arranged in a clear learning sequence. Mastered topics turn bright green with checkmarks, while upcoming topics show what's next."),
            ("Prerequisites Alert [LOCKED]", "Ever wonder why a topic is locked? Click on the lock icon to see what foundation you need first (for example, master 'Atoms' before 'Chemical Bonding')."),
            ("Interactive Knowledge Graph", "Click the <b>'Graph View'</b> tab! You will see an awesome interactive constellation of circles showing how concepts across physics, chemistry, and math connect to each other!")
        ]
    ))
    story.append(Spacer(1, 6))

    # Feature comparison table
    path_table_data = [
        [
            Paragraph("<b>Knowledge Level</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)),
            Paragraph("<b>What it Means</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)),
            Paragraph("<b>How OnePath AI Helps You</b>", ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.white))
        ],
        [
            Paragraph("<b>Foundational</b>", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=c_primary)),
            Paragraph("Building core basics and definitions.", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text)),
            Paragraph("Provides simplified explanations, extra diagrams, and friendly analogies.", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text))
        ],
        [
            Paragraph("<b>Intermediate</b>", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.HexColor("#0284C7"))),
            Paragraph("Good grasp of concepts, practicing problem-solving.", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text)),
            Paragraph("Balanced mix of concept deep-dives, formulas, and tricky quiz challenges.", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text))
        ],
        [
            Paragraph("<b>Advanced</b>", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=c_purple)),
            Paragraph("Mastered curriculum, ready for high-level thinking.", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text)),
            Paragraph("Offers Olympiad-style challenges, deeper inquiries, and speed drills.", ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text))
        ]
    ]
    path_table = Table(path_table_data, colWidths=[100, 180, 252])
    path_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_primary),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(path_table)
    story.append(Spacer(1, 5))

    story.append(create_callout_box(
        "ROADMAP TIP",
        "Green Checkmarks Mean You are Ready for Tests!",
        "When every module in a chapter turns green, your concept mastery hits 100%. That means you are fully prepared for school exams with zero last-minute panic!",
        c_green_light,
        colors.HexColor("#A7F3D0"),
        c_green
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: PRACTICE POWERHOUSE — QUIZZES & FLASHCARDS
    # =========================================================================
    story.append(Paragraph("Chapter 4: Practice Powerhouse -- Quizzes & Flashcards", h1_style))
    story.append(Paragraph(
        "Practice is how good students become great students! OnePath AI provides two exciting practice tools: <b>Interactive Quizzes</b> and <b>Spaced-Repetition Flashcards</b>.",
        body_style
    ))

    story.append(create_step_card(
        8,
        "Taking Quizzes & Leveling Up Your Score",
        "Click on <b>'Quizzes & Practice'</b> in the left sidebar to start a challenge.",
        [
            ("Choose Your Subject & Chapter", "Pick what you want to practice today--from Force & Motion to Cell Biology."),
            ("Answer at Your Own Pace", "Read each question carefully and select your option. There is no scary countdown timer!"),
            ("Detailed Answer Review", "When you finish, you don't just see a score number. OnePath AI explains <b>why</b> each option was right or wrong so you never make the same mistake twice."),
            ("Earn Mastery Points", "High scores boost your topic mastery from 20% all the way up to 100%!")
        ]
    ))
    story.append(Spacer(1, 5))

    story.append(create_step_card(
        9,
        "Flashcards & Spaced Repetition (The Memory Secret!)",
        "Click on <b>'Flashcards & Revision'</b> in the sidebar. This is the secret weapon used by top medical and engineering students worldwide!",
        [
            ("How Flashcards Work", "You see a card with a question, term, or formula. Try saying the answer in your head, then tap <b>'Flip Card'</b> to check!"),
            ("Rate Your Recall", "Tap <b>'Hard'</b>, <b>'Good'</b>, or <b>'Easy'</b> depending on how well you knew it."),
            ("What is Spaced Repetition?", "Our smart algorithm calculates the exact day and time your brain starts to forget something, and schedules that card to pop up right then!"),
            ("Zero Cramming Before Exams", "Reviewing just 10 flashcards a day locks formulas and vocabulary into your long-term memory permanently without burning out!")
        ],
        c_purple_light,
        colors.HexColor("#DDD6FE"),
        c_purple
    ))
    story.append(Spacer(1, 5))

    # Flashcard Buttons Guide Table
    flash_tbl_data = [
        [
            Paragraph("<b>Button Option</b>", ParagraphStyle('FTH1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)),
            Paragraph("<b>When to Tap It</b>", ParagraphStyle('FTH1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)),
            Paragraph("<b>What the AI Does Next</b>", ParagraphStyle('FTH1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.white))
        ],
        [
            Paragraph("<b>HARD</b>", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=colors.HexColor("#EF4444"))),
            Paragraph("You couldn't remember or got it wrong.", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text)),
            Paragraph("Shows this card again tomorrow so it sticks in your brain.", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text))
        ],
        [
            Paragraph("<b>GOOD</b>", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=c_sky)),
            Paragraph("You remembered after thinking a bit.", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text)),
            Paragraph("Schedules it 3 to 4 days later to reinforce recall.", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text))
        ],
        [
            Paragraph("<b>EASY</b>", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=c_green)),
            Paragraph("You knew it immediately without pausing.", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text)),
            Paragraph("Pushes it 1 to 2 weeks out. You've officially mastered it!", ParagraphStyle('FTD1', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text))
        ]
    ]
    flash_table = Table(flash_tbl_data, colWidths=[90, 190, 252])
    flash_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#6D28D9")), # purple dark
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(flash_table)
    story.append(Spacer(1, 5))

    story.append(create_callout_box(
        "DAILY CHALLENGE",
        "The 10-Minute Daily Practice Routine",
        "Make it a game: Do 1 quick 5-question quiz and review 5 flashcards every afternoon after school. You will find school exams become effortless and stress-free!",
        c_amber_light,
        colors.HexColor("#FCD34D"),
        c_amber
    ))

    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: NOTEBOOK, ASK TEACHER & ATTENDANCE CATCH-UP
    # =========================================================================
    story.append(Paragraph("Chapter 5: Digital Notebook, Ask Teacher & Catch-Up", h1_style))
    story.append(Paragraph(
        "School life can get busy! Here are three essential tools that make sure you stay organized, get your questions answered, and never fall behind.",
        body_style
    ))

    story.append(create_step_card(
        10,
        "Your Digital Notebook (All Notes in One Place)",
        "Click on <b>'Digital Notebook'</b> in the sidebar to open your personal cloud diary.",
        [
            ("Color-Coded & Tagged", "Organize notes by subject (Science, Math, Social Studies) or chapter."),
            ("Lightning-Fast Search", "Type any keyword into the search bar (like 'Newton's Third Law' or 'Mitochondria') to instantly pull up your notes before a class test."),
            ("Safe in the Cloud", "No lost paper notebooks, crumpled pages, or dog-eared binders. Your notes are safely backed up on any device.")
        ]
    ))
    story.append(Spacer(1, 5))

    story.append(create_step_card(
        11,
        "Ask Teacher -- Never Stay Stuck on a Doubt!",
        "Confused by a difficult homework problem or textbook question? Use the <b>Ask Teacher</b> portal.",
        [
            ("Step 1: Select Subject & Chapter", "Pick the subject and chapter related to your doubt."),
            ("Step 2: Type Your Question", "Explain clearly what you find confusing. You can even copy-paste textbook text into the context box."),
            ("Step 3: Direct to Teacher", "Your doubt goes directly into your teacher's dashboard inbox."),
            ("Step 4: Real Teacher Answer", "When your teacher replies, their answer appears in your doubt history with a verified badge!")
        ]
    ))
    story.append(Spacer(1, 5))

    story.append(create_step_card(
        12,
        "Missed a Class? Attendance Catch-Up to the Rescue!",
        "Were you sick, traveling, or had an emergency? OnePath AI makes sure you never fall behind your classmates!",
        [
            ("Automatic Detection", "On your Dashboard, look at your Attendance card. If you missed a class session, a friendly <b>'Catch Up'</b> button will appear."),
            ("Personalized AI Catch-Up Path", "Clicking 'Catch Up' compiles a concentrated summary of exactly what the teacher taught on that day!"),
            ("Quick Practice Check", "It gives you 2 or 3 quick recap exercises so you understand the core lesson before walking into class tomorrow.")
        ],
        c_green_light,
        colors.HexColor("#A7F3D0"),
        c_green
    ))
    story.append(Spacer(1, 5))

    # Doubt etiquette box
    etiquette_box = create_callout_box(
        "SMART ASKING",
        "How to Ask Great Questions to Your Teacher",
        "&bull; <b>Be Specific</b>: Instead of 'I don't get physics', write 'Can you explain step 2 of calculating kinetic energy?'<br/>"
        "&bull; <b>Mention What You Tried</b>: Teachers love seeing your effort!<br/>"
        "&bull; <b>Check Back Later</b>: Teachers usually reply during office hours or after class.",
        c_sky_light,
        colors.HexColor("#93C5FD"),
        c_sky
    )
    story.append(etiquette_box)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: STUDENT SUCCESS TOOLKIT & FAQ
    # =========================================================================
    story.append(Paragraph("Chapter 6: Student Success Habits & FAQ", h1_style))
    story.append(Paragraph(
        "Here is your easy daily routine and answers to the most common questions students ask about OnePath AI.",
        body_style
    ))

    # Daily Routine Box
    routine_items = [
        ("1. Morning / After School Check-in", "Log in and check your Dashboard. See your streak and read your recommended next action."),
        ("2. Complete 1 Study Space Lesson", "Read through the interactive lesson, inspect the visual diagram, and answer the Quick Concept Check."),
        ("3. Practice 5 Flashcards", "Flip cards to refresh memory on key terms and formulas."),
        ("4. Add 1 Note to Your Notebook", "Write down one new fact or formula you learned today."),
        ("5. Clear Doubts Early", "If anything was tricky, send a doubt via 'Ask Teacher' right away instead of waiting until exam week!")
    ]
    story.append(create_step_card(
        13,
        "The 15-Minute Daily Student Success Habit",
        "Follow this simple 5-step checklist every study day to stay at the top of your class with zero stress:",
        routine_items,
        colors.HexColor("#FFFBEB"),
        colors.HexColor("#FCD34D"),
        c_amber
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Frequently Asked Questions (FAQ)", h1_style))

    faq_data = [
        [
            Paragraph("<b>Question</b>", ParagraphStyle('FTH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.white)),
            Paragraph("<b>Friendly Answer</b>", ParagraphStyle('FTH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, textColor=colors.white))
        ],
        [
            Paragraph("<b>Will I lose marks if I make mistakes?</b>", ParagraphStyle('FQ', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=c_primary)),
            Paragraph("Never! In OnePath AI, mistakes are just clues that help the AI teach you better. Practice quizzes and diagnostics never reduce your school grade.", ParagraphStyle('FA', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text))
        ],
        [
            Paragraph("<b>Can I use this on my phone or tablet?</b>", ParagraphStyle('FQ', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=c_primary)),
            Paragraph("Yes! OnePath AI works smoothly on laptops, desktop computers, iPads, tablets, and smartphones. Just open Chrome, Safari, or Edge.", ParagraphStyle('FA', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text))
        ],
        [
            Paragraph("<b>Can other students see my personal notes?</b>", ParagraphStyle('FQ', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=c_primary)),
            Paragraph("No. Your Digital Notebook is 100% private to your account. Only you can view, edit, or delete your personal notes.", ParagraphStyle('FA', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text))
        ],
        [
            Paragraph("<b>How do I switch between Light & Dark mode?</b>", ParagraphStyle('FQ', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=c_primary)),
            Paragraph("Look at the top-right corner of the screen next to your name. Click the Sun/Moon icon to switch between Bright Day and Cozy Night mode!", ParagraphStyle('FA', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text))
        ],
        [
            Paragraph("<b>Who answers my questions in 'Ask Teacher'?</b>", ParagraphStyle('FQ', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, textColor=c_primary)),
            Paragraph("Your actual school teacher! When they log into their teacher portal, your question is waiting in their inbox so they can give you personal advice.", ParagraphStyle('FA', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, textColor=c_text))
        ]
    ]

    faq_table = Table(faq_data, colWidths=[190, 342])
    faq_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_sky),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(faq_table)
    story.append(Spacer(1, 6))

    # Cheerful Closing Card
    closing_card = Table([[
        Paragraph(
            "<para align='center'><b>You've Got This, Explorer!</b><br/>"
            "Every expert was once a beginner. Take it one chapter at a time, explore with curiosity, "
            "and enjoy your learning adventure with <b>OnePath AI</b>!</para>",
            ParagraphStyle('Closing', parent=styles['Normal'], fontName='Helvetica', fontSize=8.5, leading=12.5, textColor=c_primary)
        )
    ]], colWidths=[532])
    closing_card.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#EFF6FF")),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#60A5FA")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 9),
        ('RIGHTPADDING', (0,0), (-1,-1), 9),
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
            bottomMargin=46
        )
        doc.build(story, canvasmaker=NumberedCanvas)
        print(f"[Success] Generated PDF at: {target_path}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))

    targets = [
        os.path.join(project_root, "frontend", "public", "OnePath_AI_Student_Guide.pdf"),
        os.path.join(project_root, "backend", "uploads", "OnePath_AI_Student_Guide.pdf"),
    ]

    build_student_guide_pdf(targets)
