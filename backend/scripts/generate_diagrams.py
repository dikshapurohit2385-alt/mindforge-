"""
Generate crisp, colorful, high-resolution student flowchart and visual diagram assets
to embed into the OnePath AI Student Guide PDF.
"""

import os
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

# Load Segoe UI fonts
FONT_DIR = "C:/Windows/Fonts"
f_title = ImageFont.truetype(os.path.join(FONT_DIR, "segoeuib.ttf"), 20)
f_sub = ImageFont.truetype(os.path.join(FONT_DIR, "segoeuib.ttf"), 15)
f_bold = ImageFont.truetype(os.path.join(FONT_DIR, "segoeuib.ttf"), 13)
f_reg = ImageFont.truetype(os.path.join(FONT_DIR, "segoeui.ttf"), 11.5)
f_small = ImageFont.truetype(os.path.join(FONT_DIR, "segoeui.ttf"), 10)
f_pill = ImageFont.truetype(os.path.join(FONT_DIR, "segoeuib.ttf"), 11)

def draw_arrow(draw, start_xy, end_xy, color="#94A3B8", width=3, arrow_size=8):
    """Draw a line with a triangular arrow at the end."""
    x1, y1 = start_xy
    x2, y2 = end_xy
    draw.line([start_xy, end_xy], fill=color, width=width)
    
    # Horizontal arrow pointing right
    if x2 > x1 and y1 == y2:
        points = [
            (x2, y2),
            (x2 - arrow_size, y2 - arrow_size),
            (x2 - arrow_size, y2 + arrow_size)
        ]
        draw.polygon(points, fill=color)
    # Vertical arrow pointing down
    elif y2 > y1 and x1 == x2:
        points = [
            (x2, y2),
            (x2 - arrow_size, y2 - arrow_size),
            (x2 + arrow_size, y2 - arrow_size)
        ]
        draw.polygon(points, fill=color)


# -------------------------------------------------------------------------
# 1. Flowchart: Daily Learning Adventure (Page 1)
# -------------------------------------------------------------------------
def create_flow_daily_journey():
    W, H = 1064, 210
    img = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)

    # Outer container
    d.rounded_rectangle([2, 2, W-3, H-3], radius=16, fill="#F0F9FF", outline="#BAE6FD", width=2)
    
    # Title Banner
    d.text((24, 14), "VISUAL FLOWCHART: YOUR DAILY 4-STEP LEARNING ADVENTURE", font=f_sub, fill="#0369A1")

    # 4 Cards
    cards = [
        ("1. LOG IN & HQ", "Check streak, class\nbadge & continue topic", "#0284C7", "#E0F2FE", "#0284C7"),
        ("2. STUDY SPACE", "Read smart lesson &\ninteractive diagrams", "#4F46E5", "#EEF2FF", "#4F46E5"),
        ("3. PRACTICE", "5-min quick quiz &\nflip flashcards", "#D97706", "#FEF3C7", "#D97706"),
        ("4. 100% MASTERY", "Build permanent memory\n& celebrate streak!", "#059669", "#D1FAE5", "#059669")
    ]

    card_w = 216
    card_h = 130
    start_x = 24
    start_y = 52
    spacing = 42

    for i, (head, desc, bar_col, bg_col, text_col) in enumerate(cards):
        x = start_x + i * (card_w + spacing)
        y = start_y
        
        # Card body
        d.rounded_rectangle([x, y, x + card_w, y + card_h], radius=12, fill="#FFFFFF", outline="#CBD5E1", width=1)
        # Top color accent bar
        d.rounded_rectangle([x, y, x + card_w, y + 36], radius=12, fill=bg_col)
        d.rectangle([x, y + 24, x + card_w, y + 36], fill=bg_col) # flatten bottom corners of bar
        
        # Header text
        d.text((x + 14, y + 10), head, font=f_bold, fill=text_col)
        # Description text
        d.text((x + 14, y + 48), desc, font=f_reg, fill="#334155", spacing=4)
        
        # Arrow to next card
        if i < 3:
            ax1 = x + card_w + 6
            ax2 = ax1 + spacing - 14
            ay = y + card_h // 2
            draw_arrow(d, (ax1, ay), (ax2, ay), color="#0284C7", width=3, arrow_size=7)

    out_path = os.path.join(ASSETS_DIR, "flow_daily_journey.png")
    img.save(out_path, dpi=(150, 150))
    print(f"Created: {out_path}")


# -------------------------------------------------------------------------
# 2. Visual: Inside an Interactive Study Space Lesson (Page 2)
# -------------------------------------------------------------------------
def create_visual_study_space():
    W, H = 1064, 210
    img = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)

    # Outer container
    d.rounded_rectangle([2, 2, W-3, H-3], radius=16, fill="#F8FAFC", outline="#CBD5E1", width=2)
    
    # Title
    d.text((24, 14), "INSIDE THE STUDY SPACE: 3 INTERACTIVE TOOLS ON YOUR SCREEN", font=f_sub, fill="#1E3A8A")

    col_w = 320
    col_h = 135
    start_x = 24
    start_y = 50
    spacing = 26

    # Col 1: Visual Diagrams
    x1 = start_x
    d.rounded_rectangle([x1, start_y, x1 + col_w, start_y + col_h], radius=12, fill="#EFF6FF", outline="#93C5FD", width=1)
    d.text((x1 + 14, start_y + 10), "1. Interactive Visual Diagram", font=f_bold, fill="#1D4ED8")
    d.text((x1 + 14, start_y + 32), "See concepts moving in real time!", font=f_small, fill="#475569")
    # Mini flowchart box inside
    d.rounded_rectangle([x1 + 14, start_y + 54, x1 + 120, start_y + 115], radius=8, fill="#FFFFFF", outline="#60A5FA", width=1)
    d.text((x1 + 22, start_y + 64), "Potential\nEnergy (PE)", font=f_small, fill="#1E3A8A")
    draw_arrow(d, (x1 + 125, start_y + 85), (x1 + 185, start_y + 85), color="#2563EB", width=2, arrow_size=6)
    d.rounded_rectangle([x1 + 195, start_y + 54, x1 + 305, start_y + 115], radius=8, fill="#FFFFFF", outline="#60A5FA", width=1)
    d.text((x1 + 203, start_y + 64), "Kinetic\nEnergy (KE)", font=f_small, fill="#1E3A8A")

    # Col 2: Highlighter & Note Taking
    x2 = x1 + col_w + spacing
    d.rounded_rectangle([x2, start_y, x2 + col_w, start_y + col_h], radius=12, fill="#F0FDF4", outline="#86EFAC", width=1)
    d.text((x2 + 14, start_y + 10), "2. Text Highlighter & Notes", font=f_bold, fill="#15803D")
    d.text((x2 + 14, start_y + 32), "Click and drag to mark key formulas", font=f_small, fill="#475569")
    # Simulated highlighted text block
    d.rounded_rectangle([x2 + 14, start_y + 54, x2 + 305, start_y + 82], radius=6, fill="#FEF08A") # Yellow highlight
    d.text((x2 + 20, start_y + 60), "Energy cannot be created or destroyed.", font=f_bold, fill="#713F12")
    d.rounded_rectangle([x2 + 14, start_y + 88, x2 + 305, start_y + 122], radius=6, fill="#FFFFFF", outline="#A7F3D0")
    d.text((x2 + 20, start_y + 94), "My Note: Remember KE = 1/2 m v^2", font=f_small, fill="#047857")

    # Col 3: Quick Concept Check
    x3 = x2 + col_w + spacing
    d.rounded_rectangle([x3, start_y, x3 + col_w, start_y + col_h], radius=12, fill="#FFFBEB", outline="#FDE68A", width=1)
    d.text((x3 + 14, start_y + 10), "3. Quick Concept Check", font=f_bold, fill="#B45309")
    d.text((x3 + 14, start_y + 32), "Answer 1 question to lock in understanding", font=f_small, fill="#475569")
    # Mini quiz card
    d.rounded_rectangle([x3 + 14, start_y + 54, x3 + 305, start_y + 82], radius=6, fill="#FFFFFF", outline="#FBBF24")
    d.text((x3 + 20, start_y + 61), "[A] Joules  [B] Newtons  [C] Watts", font=f_small, fill="#1E293B")
    # Green feedback pill
    d.rounded_rectangle([x3 + 14, start_y + 88, x3 + 305, start_y + 122], radius=6, fill="#DCFCE7", outline="#86EFAC")
    d.text((x3 + 20, start_y + 95), "Correct! Energy is measured in Joules!", font=f_bold, fill="#166534")

    out_path = os.path.join(ASSETS_DIR, "visual_study_space.png")
    img.save(out_path, dpi=(150, 150))
    print(f"Created: {out_path}")


# -------------------------------------------------------------------------
# 3. Flowchart: Diagnostic Assessment to Custom Path (Page 3)
# -------------------------------------------------------------------------
def create_flow_diagnostic_level():
    W, H = 1064, 215
    img = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)

    # Outer container
    d.rounded_rectangle([2, 2, W-3, H-3], radius=16, fill="#F5F3FF", outline="#DDD6FE", width=2)
    
    # Title
    d.text((24, 14), "HOW THE DIAGNOSTIC CHECKUP CREATES YOUR CUSTOM PATH", font=f_sub, fill="#6D28D9")

    # Left Box: Friendly 5-Min Diagnostic
    d.rounded_rectangle([24, 52, 280, 192], radius=12, fill="#FFFFFF", outline="#8B5CF6", width=2)
    d.text((40, 68), "Friendly Diagnostic", font=f_bold, fill="#6D28D9")
    d.text((40, 92), "• 5-10 Quick Questions\n• NO negative marks\n• Identifies visual vs verbal\n• Detects your baseline", font=f_reg, fill="#334155", spacing=5)

    # Arrow to Center Brain
    draw_arrow(d, (285, 122), (345, 122), color="#7C3AED", width=3, arrow_size=8)

    # Center Box: OnePath AI Engine
    d.rounded_rectangle([355, 62, 595, 182], radius=14, fill="#7C3AED")
    d.text((380, 85), "OnePath AI Engine", font=f_title, fill="#FFFFFF")
    d.text((380, 118), "Calibrates lessons to\nyour unique speed!", font=f_bold, fill="#DDD6FE", spacing=4)

    # 3 Arrows branching to the right
    draw_arrow(d, (600, 85), (660, 85), color="#D97706", width=2, arrow_size=6)
    draw_arrow(d, (600, 122), (660, 122), color="#0284C7", width=2, arrow_size=6)
    draw_arrow(d, (600, 160), (660, 160), color="#7C3AED", width=2, arrow_size=6)

    # 3 Level Output Badges
    # Foundational
    d.rounded_rectangle([670, 62, 1040, 98], radius=8, fill="#FEF3C7", outline="#FCD34D", width=1)
    d.text((685, 72), "Foundational Path: Simplified words + Extra diagrams", font=f_bold, fill="#B45309")
    
    # Intermediate
    d.rounded_rectangle([670, 104, 1040, 140], radius=8, fill="#E0F2FE", outline="#7DD3FC", width=1)
    d.text((685, 114), "Intermediate Path: Core concepts + Formula drills", font=f_bold, fill="#0369A1")

    # Advanced
    d.rounded_rectangle([670, 146, 1040, 182], radius=8, fill="#EDE9FE", outline="#C4B5FD", width=1)
    d.text((685, 156), "Advanced Path: Olympiad questions + Speed challenges", font=f_bold, fill="#5B21B6")

    out_path = os.path.join(ASSETS_DIR, "flow_diagnostic_level.png")
    img.save(out_path, dpi=(150, 150))
    print(f"Created: {out_path}")


# -------------------------------------------------------------------------
# 4. Flowchart: Spaced Repetition Flashcards (Page 4)
# -------------------------------------------------------------------------
def create_flow_flashcard_cycle():
    W, H = 1064, 210
    img = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)

    # Outer container
    d.rounded_rectangle([2, 2, W-3, H-3], radius=16, fill="#FFFBEB", outline="#FDE68A", width=2)
    
    # Title
    d.text((24, 14), "THE SPACED-REPETITION FLASHCARD CYCLE: HOW LONG-TERM MEMORY WORKS", font=f_sub, fill="#B45309")

    # 4 Cyclic steps
    steps = [
        ("Step 1: See Question", "Read the front of the\ncard & test your recall", "#F59E0B", "#FFFBEB"),
        ("Step 2: Flip Card", "Tap to check definition,\nformula or answer", "#6366F1", "#EEF2FF"),
        ("Step 3: Rate Recall", "Tap [HARD], [GOOD],\nor [EASY] button", "#0284C7", "#E0F2FE"),
        ("Step 4: AI Schedules", "Card pops up right\nbefore you forget!", "#10B981", "#ECFDF5")
    ]

    card_w = 216
    card_h = 130
    start_x = 24
    start_y = 52
    spacing = 42

    for i, (title, desc, col, bg) in enumerate(steps):
        x = start_x + i * (card_w + spacing)
        y = start_y
        d.rounded_rectangle([x, y, x + card_w, y + card_h], radius=12, fill="#FFFFFF", outline=col, width=2)
        d.rounded_rectangle([x, y, x + card_w, y + 36], radius=12, fill=bg)
        d.rectangle([x, y + 24, x + card_w, y + 36], fill=bg)
        d.text((x + 14, y + 10), title, font=f_bold, fill=col)
        d.text((x + 14, y + 48), desc, font=f_reg, fill="#334155", spacing=4)

        if i < 3:
            ax1 = x + card_w + 6
            ax2 = ax1 + spacing - 14
            ay = y + card_h // 2
            draw_arrow(d, (ax1, ay), (ax2, ay), color=col, width=3, arrow_size=7)

    out_path = os.path.join(ASSETS_DIR, "flow_flashcard_cycle.png")
    img.save(out_path, dpi=(150, 150))
    print(f"Created: {out_path}")


# -------------------------------------------------------------------------
# 5. Flowchart: Ask Teacher & Attendance Catch-Up (Page 5)
# -------------------------------------------------------------------------
def create_flow_ask_teacher_catchup():
    W, H = 1064, 215
    img = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)

    # Outer container
    d.rounded_rectangle([2, 2, W-3, H-3], radius=16, fill="#F0FDF4", outline="#BBF7D0", width=2)
    
    # Title
    d.text((24, 12), "TWO SUPER HELPFUL SHORTCUTS: ASK TEACHER & ATTENDANCE CATCH-UP", font=f_sub, fill="#15803D")

    # Flow A (Top half): Ask Teacher
    y_a = 46
    d.rounded_rectangle([24, y_a, 200, y_a + 68], radius=10, fill="#FFFFFF", outline="#0284C7", width=1)
    d.text((36, y_a + 12), "1. Spot a Doubt", font=f_bold, fill="#0369A1")
    d.text((36, y_a + 34), "Homework problem\nor tricky formula", font=f_small, fill="#475569")
    draw_arrow(d, (228, y_a + 34), (278, y_a + 34), color="#0284C7", width=2, arrow_size=6)

    d.rounded_rectangle([285, y_a, 485, y_a + 68], radius=10, fill="#FFFFFF", outline="#0284C7", width=1)
    d.text((297, y_a + 12), "2. Type Question in App", font=f_bold, fill="#0369A1")
    d.text((297, y_a + 34), "Pick subject & chapter,\nattach optional text", font=f_small, fill="#475569")
    draw_arrow(d, (490, y_a + 34), (540, y_a + 34), color="#0284C7", width=2, arrow_size=6)

    d.rounded_rectangle([548, y_a, 748, y_a + 68], radius=10, fill="#FFFFFF", outline="#0284C7", width=1)
    d.text((560, y_a + 12), "3. Sent to Teacher HQ", font=f_bold, fill="#0369A1")
    d.text((560, y_a + 34), "Delivered directly into\nyour teacher's inbox", font=f_small, fill="#475569")
    draw_arrow(d, (754, y_a + 34), (804, y_a + 34), color="#0284C7", width=2, arrow_size=6)

    d.rounded_rectangle([812, y_a, 1040, y_a + 68], radius=10, fill="#E0F2FE", outline="#0284C7", width=2)
    d.text((824, y_a + 12), "4. Verified Solution!", font=f_bold, fill="#0369A1")
    d.text((824, y_a + 34), "Teacher replies with\nstep-by-step guidance", font=f_small, fill="#075985")

    # Flow B (Bottom half): Attendance Catch-Up
    y_b = 130
    d.rounded_rectangle([24, y_b, 200, y_b + 68], radius=10, fill="#FFFFFF", outline="#059669", width=1)
    d.text((36, y_b + 12), "1. Absent from Class", font=f_bold, fill="#047857")
    d.text((36, y_b + 34), "Sick, traveling, or\nfamily emergency", font=f_small, fill="#475569")
    draw_arrow(d, (228, y_b + 34), (278, y_b + 34), color="#059669", width=2, arrow_size=6)

    d.rounded_rectangle([285, y_b, 485, y_b + 68], radius=10, fill="#FFFFFF", outline="#059669", width=1)
    d.text((297, y_b + 12), "2. AI Detects Absence", font=f_bold, fill="#047857")
    d.text((297, y_b + 34), "Identifies exact topics\ntaught that day", font=f_small, fill="#475569")
    draw_arrow(d, (490, y_b + 34), (540, y_b + 34), color="#059669", width=2, arrow_size=6)

    d.rounded_rectangle([548, y_b, 748, y_b + 68], radius=10, fill="#FFFFFF", outline="#059669", width=1)
    d.text((560, y_b + 12), "3. 1-Click 'Catch Up'", font=f_bold, fill="#047857")
    d.text((560, y_b + 34), "Generates concise\n10-minute recap lesson", font=f_small, fill="#475569")
    draw_arrow(d, (754, y_b + 34), (804, y_b + 34), color="#059669", width=2, arrow_size=6)

    d.rounded_rectangle([812, y_b, 1040, y_b + 68], radius=10, fill="#DCFCE7", outline="#059669", width=2)
    d.text((824, y_b + 12), "4. Ready for Tomorrow!", font=f_bold, fill="#047857")
    d.text((824, y_b + 34), "Walk into class confident\nand up to speed!", font=f_small, fill="#065F46")

    out_path = os.path.join(ASSETS_DIR, "flow_ask_teacher_catchup.png")
    img.save(out_path, dpi=(150, 150))
    print(f"Created: {out_path}")


# -------------------------------------------------------------------------
# 6. Visual: The 5-Star Student Daily Habit Roadmap (Page 6)
# -------------------------------------------------------------------------
def create_visual_daily_checklist():
    W, H = 1064, 195
    img = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    d = ImageDraw.Draw(img)

    # Outer container
    d.rounded_rectangle([2, 2, W-3, H-3], radius=16, fill="#FFFBEB", outline="#FDE68A", width=2)
    
    # Title
    d.text((24, 14), "THE 15-MINUTE DAILY HABIT: YOUR ROADMAP TO TOP GRADES", font=f_sub, fill="#B45309")

    # 5 steps in a connected ribbon
    steps = [
        ("Step 1", "Morning Check-in", "Streak & HQ Banner", "#0284C7"),
        ("Step 2", "Read 1 Lesson", "With visual diagram", "#4F46E5"),
        ("Step 3", "5 Flashcards", "Spaced repetition", "#D97706"),
        ("Step 4", "Save 1 Note", "In cloud notebook", "#059669"),
        ("Step 5", "Ask Doubts", "Zero test panic!", "#7C3AED")
    ]

    card_w = 172
    card_h = 115
    start_x = 24
    start_y = 52
    spacing = 33

    for i, (step_num, title, sub, col) in enumerate(steps):
        x = start_x + i * (card_w + spacing)
        y = start_y
        
        d.rounded_rectangle([x, y, x + card_w, y + card_h], radius=12, fill="#FFFFFF", outline=col, width=2)
        # Top pill badge
        d.rounded_rectangle([x + 10, y + 10, x + card_w - 10, y + 34], radius=6, fill=col)
        d.text((x + 18, y + 14), step_num, font=f_pill, fill="#FFFFFF")
        # Text
        d.text((x + 12, y + 46), title, font=f_bold, fill="#0F172A")
        d.text((x + 12, y + 74), sub, font=f_reg, fill="#475569")

        if i < 4:
            ax1 = x + card_w + 4
            ax2 = ax1 + spacing - 10
            ay = y + card_h // 2
            draw_arrow(d, (ax1, ay), (ax2, ay), color=col, width=3, arrow_size=6)

    out_path = os.path.join(ASSETS_DIR, "visual_daily_checklist.png")
    img.save(out_path, dpi=(150, 150))
    print(f"Created: {out_path}")


if __name__ == "__main__":
    print("Generating visual diagrams and flowcharts...")
    create_flow_daily_journey()
    create_visual_study_space()
    create_flow_diagnostic_level()
    create_flow_flashcard_cycle()
    create_flow_ask_teacher_catchup()
    create_visual_daily_checklist()
    print("All diagrams generated successfully!")
