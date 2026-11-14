// Generated from the Practical Skill Checker and Practical Guidance PDFs (3rd edition).
// Skills come from the checker's circles. A skill lists the guides whose steps practise it, matched from the wording of each guide.
// Skills no guide mentions are 'bonus': a student can still tick them off from the checker.
export const APPS = [
 {
  "id": "word",
  "name": "Word",
  "sub": "Document production",
  "color": "#1f7fe0",
  "categories": [
   {
    "id": "font",
    "name": "Font",
    "skills": [
     {
      "id": "word.font.font-name",
      "name": "Font Name",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.font.font-size",
      "name": "Font Size",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.font.font-color",
      "name": "Font Color",
      "guides": []
     },
     {
      "id": "word.font.bold",
      "name": "Bold",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht2"
      ]
     },
     {
      "id": "word.font.italic",
      "name": "Italic",
      "guides": [
       "word-cg1",
       "word-cg2"
      ]
     },
     {
      "id": "word.font.underline",
      "name": "Underline",
      "guides": []
     },
     {
      "id": "word.font.all-caps",
      "name": "All Caps",
      "guides": [
       "word-cg2"
      ]
     },
     {
      "id": "word.font.strikethrough",
      "name": "Strikethrough",
      "guides": []
     },
     {
      "id": "word.font.superscript",
      "name": "Superscript",
      "guides": [
       "word-cg1"
      ]
     },
     {
      "id": "word.font.subscript",
      "name": "Subscript",
      "guides": [
       "word-cg2",
       "word-ht2"
      ]
     },
     {
      "id": "word.font.highlight",
      "name": "Highlight",
      "guides": []
     }
    ]
   },
   {
    "id": "inserting",
    "name": "Inserting",
    "skills": [
     {
      "id": "word.inserting.blank-page",
      "name": "Blank Page",
      "guides": [
       "word-cg1",
       "word-ht1"
      ]
     },
     {
      "id": "word.inserting.drop-cap",
      "name": "Drop Cap",
      "guides": []
     },
     {
      "id": "word.inserting.shape",
      "name": "Shape",
      "guides": []
     },
     {
      "id": "word.inserting.picture",
      "name": "Picture",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.inserting.header-footer-first-page-only",
      "name": "Header & Footer — First Page only",
      "guides": [
       "word-ht1"
      ]
     },
     {
      "id": "word.inserting.header-footer-odd-even",
      "name": "Header & Footer — Odd / Even",
      "guides": []
     },
     {
      "id": "word.inserting.header-footer-page-number",
      "name": "Header & Footer — Page Number",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.inserting.header-footer-date",
      "name": "Header & Footer — Date",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.inserting.header-footer-file-name",
      "name": "Header & Footer — File Name",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.inserting.header-footer-include-path",
      "name": "Header & Footer — Include Path",
      "guides": [
       "word-cg1"
      ]
     }
    ]
   },
   {
    "id": "paragraphing",
    "name": "Paragraphing",
    "skills": [
     {
      "id": "word.paragraphing.bullets-ordered",
      "name": "Bullets — Ordered",
      "guides": [
       "word-cg2"
      ]
     },
     {
      "id": "word.paragraphing.bullets-unordered",
      "name": "Bullets — Unordered",
      "guides": [
       "word-cg1",
       "word-ht2"
      ]
     },
     {
      "id": "word.paragraphing.bullets-custom",
      "name": "Bullets — Custom",
      "guides": [
       "word-ht1"
      ]
     },
     {
      "id": "word.paragraphing.alignment-left",
      "name": "Alignment — Left",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.paragraphing.alignment-right",
      "name": "Alignment — Right",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.paragraphing.alignment-center",
      "name": "Alignment — Center",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.paragraphing.justify",
      "name": "Justify",
      "guides": [
       "word-cg2"
      ]
     },
     {
      "id": "word.paragraphing.increase-indentation",
      "name": "Increase Indentation",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.paragraphing.decrease-indentation",
      "name": "Decrease Indentation",
      "guides": []
     },
     {
      "id": "word.paragraphing.indentation-1st-line",
      "name": "Indentation — 1st line",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.paragraphing.indentation-hanging",
      "name": "Indentation — Hanging",
      "guides": []
     },
     {
      "id": "word.paragraphing.shading",
      "name": "Shading",
      "guides": [
       "word-cg2",
       "word-ht2"
      ]
     },
     {
      "id": "word.paragraphing.show-hide-page-breaks",
      "name": "Show / Hide page breaks",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.paragraphing.tab-insertions",
      "name": "Tab Insertions",
      "guides": [
       "word-cg2",
       "word-ht2"
      ]
     },
     {
      "id": "word.paragraphing.spacing-paragraph",
      "name": "Spacing — Paragraph",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.paragraphing.spacing-line",
      "name": "Spacing — Line",
      "guides": [
       "word-cg1",
       "word-ht1",
       "word-ht2"
      ]
     }
    ]
   },
   {
    "id": "layout",
    "name": "Layout",
    "skills": [
     {
      "id": "word.layout.margin",
      "name": "Margin",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.layout.set-gutter",
      "name": "Set Gutter",
      "guides": []
     },
     {
      "id": "word.layout.orientation",
      "name": "Orientation",
      "guides": [
       "word-cg1",
       "word-ht1"
      ]
     },
     {
      "id": "word.layout.page-size",
      "name": "Page Size",
      "guides": [
       "word-cg1",
       "word-ht1"
      ]
     },
     {
      "id": "word.layout.columns",
      "name": "Columns",
      "guides": [
       "word-cg1",
       "word-ht1"
      ]
     },
     {
      "id": "word.layout.set-header-and-footer-margin",
      "name": "Set Header and Footer Margin",
      "guides": []
     }
    ]
   },
   {
    "id": "table",
    "name": "Table",
    "skills": [
     {
      "id": "word.table.border-weight",
      "name": "Border weight",
      "guides": [
       "word-cg2",
       "word-ht2"
      ]
     },
     {
      "id": "word.table.view-gridlines",
      "name": "View Gridlines",
      "guides": []
     },
     {
      "id": "word.table.make-gridlines-invisible",
      "name": "Make Gridlines invisible",
      "guides": []
     },
     {
      "id": "word.table.merge-cells",
      "name": "Merge Cells",
      "guides": [
       "word-cg2",
       "word-ht2"
      ]
     },
     {
      "id": "word.table.insert-col-row",
      "name": "Insert Col / Row",
      "guides": [
       "word-cg2",
       "word-ht2"
      ]
     },
     {
      "id": "word.table.delete-col-row",
      "name": "Delete Col / Row",
      "guides": []
     },
     {
      "id": "word.table.vertical-alignment",
      "name": "Vertical Alignment",
      "guides": []
     },
     {
      "id": "word.table.table-width",
      "name": "Table Width",
      "guides": []
     },
     {
      "id": "word.table.row-height",
      "name": "Row Height",
      "guides": []
     }
    ]
   },
   {
    "id": "picture-managing",
    "name": "Picture Managing",
    "skills": [
     {
      "id": "word.picture-managing.wrapping",
      "name": "Wrapping",
      "guides": []
     },
     {
      "id": "word.picture-managing.fit-to-column",
      "name": "Fit to column",
      "guides": [
       "word-cg1",
       "word-ht1"
      ]
     },
     {
      "id": "word.picture-managing.crop",
      "name": "Crop",
      "guides": [
       "word-cg1"
      ]
     },
     {
      "id": "word.picture-managing.resize",
      "name": "Resize",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.picture-managing.flip",
      "name": "Flip",
      "guides": []
     }
    ]
   },
   {
    "id": "designing",
    "name": "Designing",
    "skills": [
     {
      "id": "word.designing.watermark",
      "name": "Watermark",
      "guides": []
     },
     {
      "id": "word.designing.custom-watermark",
      "name": "Custom Watermark",
      "guides": []
     },
     {
      "id": "word.designing.page-border",
      "name": "Page Border",
      "guides": []
     }
    ]
   },
   {
    "id": "style",
    "name": "Style",
    "skills": [
     {
      "id": "word.style.clearing-style",
      "name": "Clearing style",
      "guides": []
     },
     {
      "id": "word.style.adding-new-style",
      "name": "Adding New Style",
      "guides": [
       "word-cg2",
       "word-ht2"
      ]
     },
     {
      "id": "word.style.naming-the-style",
      "name": "Naming the Style",
      "guides": [
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.style.modifying-style",
      "name": "Modifying Style",
      "guides": [
       "word-cg2",
       "word-ht2"
      ]
     }
    ]
   },
   {
    "id": "other",
    "name": "Other",
    "skills": [
     {
      "id": "word.other.text-wrapping",
      "name": "Text Wrapping",
      "guides": []
     },
     {
      "id": "word.other.find-a-sentence-or-word",
      "name": "Find a Sentence or Word",
      "guides": [
       "word-cg1",
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.other.replace-word",
      "name": "Replace Word",
      "guides": []
     },
     {
      "id": "word.other.toggle-field-codes",
      "name": "Toggle Field Codes",
      "guides": []
     },
     {
      "id": "word.other.add-bookmark",
      "name": "Add Bookmark",
      "guides": [
       "word-cg2",
       "word-ht1",
       "word-ht2"
      ]
     },
     {
      "id": "word.other.add-link-hyperlink",
      "name": "Add Link / Hyperlink",
      "guides": [
       "word-cg2",
       "word-ht2"
      ]
     }
    ]
   }
  ]
 },
 {
  "id": "powerpoint",
  "name": "PowerPoint",
  "sub": "Presentation authoring",
  "color": "#e0572d",
  "categories": [
   {
    "id": "slides",
    "name": "Slides",
    "skills": [
     {
      "id": "powerpoint.slides.add-new-slide",
      "name": "Add New Slide",
      "guides": [
       "powerpoint-cg1",
       "powerpoint-cg2",
       "powerpoint-ht1",
       "powerpoint-ht2"
      ]
     },
     {
      "id": "powerpoint.slides.selecting-the-needed-layout",
      "name": "Selecting the needed layout",
      "guides": [
       "powerpoint-cg1",
       "powerpoint-cg2"
      ]
     },
     {
      "id": "powerpoint.slides.add-slides-from-the-layout",
      "name": "Add Slides from the layout",
      "guides": [
       "powerpoint-cg1",
       "powerpoint-cg2"
      ]
     }
    ]
   },
   {
    "id": "transition",
    "name": "Transition",
    "skills": [
     {
      "id": "powerpoint.transition.select-the-transition",
      "name": "Select the transition",
      "guides": [
       "powerpoint-cg2",
       "powerpoint-ht2"
      ]
     },
     {
      "id": "powerpoint.transition.set-duration",
      "name": "Set duration",
      "guides": []
     },
     {
      "id": "powerpoint.transition.take-evidence-of-transition",
      "name": "Take Evidence of Transition",
      "guides": []
     }
    ]
   },
   {
    "id": "animation",
    "name": "Animation",
    "skills": [
     {
      "id": "powerpoint.animation.select-the-animation",
      "name": "Select the animation",
      "guides": [
       "powerpoint-cg2",
       "powerpoint-ht2"
      ]
     },
     {
      "id": "powerpoint.animation.set-duration",
      "name": "Set duration",
      "guides": []
     },
     {
      "id": "powerpoint.animation.set-animation-one-at-a-time",
      "name": "Set animation one at a time",
      "guides": [
       "powerpoint-cg2",
       "powerpoint-ht2"
      ]
     },
     {
      "id": "powerpoint.animation.set-the-order-of-animation",
      "name": "Set the order of animation",
      "guides": []
     },
     {
      "id": "powerpoint.animation.take-evidence-of-animation",
      "name": "Take Evidence of animation",
      "guides": []
     }
    ]
   },
   {
    "id": "master-slide",
    "name": "Master Slide",
    "skills": [
     {
      "id": "powerpoint.master-slide.show-slide-master-view",
      "name": "Show Slide Master View",
      "guides": [
       "powerpoint-cg1",
       "powerpoint-cg2",
       "powerpoint-ht1",
       "powerpoint-ht2"
      ]
     },
     {
      "id": "powerpoint.master-slide.select-the-correct-slide",
      "name": "Select the correct Slide",
      "guides": [
       "powerpoint-cg1",
       "powerpoint-cg2",
       "powerpoint-ht1",
       "powerpoint-ht2"
      ]
     },
     {
      "id": "powerpoint.master-slide.add-footer-header",
      "name": "Add Footer & Header",
      "guides": [
       "powerpoint-cg1"
      ]
     },
     {
      "id": "powerpoint.master-slide.add-horizontal-vertical-lines",
      "name": "Add Horizontal & Vertical Lines",
      "guides": [
       "powerpoint-cg1",
       "powerpoint-cg2",
       "powerpoint-ht1",
       "powerpoint-ht2"
      ]
     },
     {
      "id": "powerpoint.master-slide.change-background-color",
      "name": "Change Background Color",
      "guides": [
       "powerpoint-cg1",
       "powerpoint-cg2",
       "powerpoint-ht1",
       "powerpoint-ht2"
      ]
     }
    ]
   },
   {
    "id": "other",
    "name": "Other",
    "skills": [
     {
      "id": "powerpoint.other.hide-background-graphics",
      "name": "Hide Background Graphics",
      "guides": []
     },
     {
      "id": "powerpoint.other.looping-continuously-until-esc",
      "name": "Looping continuously until Esc",
      "guides": [
       "powerpoint-cg2",
       "powerpoint-ht2"
      ]
     },
     {
      "id": "powerpoint.other.bullet-demote-and-promote",
      "name": "Bullet Demote and Promote",
      "guides": [
       "powerpoint-cg1",
       "powerpoint-cg2",
       "powerpoint-ht1",
       "powerpoint-ht2"
      ]
     },
     {
      "id": "powerpoint.other.insert-hyperlink",
      "name": "Insert Hyperlink",
      "guides": [
       "powerpoint-cg2",
       "powerpoint-ht2"
      ]
     },
     {
      "id": "powerpoint.other.line-position",
      "name": "Line Position",
      "guides": [
       "powerpoint-cg1",
       "powerpoint-cg2",
       "powerpoint-ht1"
      ]
     },
     {
      "id": "powerpoint.other.action-button",
      "name": "Action Button",
      "guides": []
     }
    ]
   }
  ]
 },
 {
  "id": "access",
  "name": "Access",
  "sub": "Database design",
  "color": "#d3173f",
  "categories": [
   {
    "id": "table",
    "name": "Table",
    "skills": [
     {
      "id": "access.table.import-table",
      "name": "Import Table",
      "guides": [
       "access-cg1",
       "access-cg2",
       "access-cg5",
       "access-ht1",
       "access-ht2"
      ]
     },
     {
      "id": "access.table.first-row-tick",
      "name": "First Row tick",
      "guides": []
     },
     {
      "id": "access.table.format-decimal-place",
      "name": "Format — Decimal place",
      "guides": [
       "access-cg3",
       "access-ht3"
      ]
     },
     {
      "id": "access.table.format-currency",
      "name": "Format — Currency",
      "guides": [
       "access-cg1",
       "access-cg2",
       "access-cg3",
       "access-cg4",
       "access-ht1",
       "access-ht2"
      ]
     },
     {
      "id": "access.table.format-integer",
      "name": "Format — Integer",
      "guides": []
     },
     {
      "id": "access.table.format-boolean",
      "name": "Format — Boolean",
      "guides": [
       "access-cg1",
       "access-cg2",
       "access-ht1",
       "access-ht2"
      ]
     },
     {
      "id": "access.table.lookup-to-specific-list-of-values",
      "name": "Lookup to specific List of values",
      "guides": []
     },
     {
      "id": "access.table.row-source-type",
      "name": "Row source type",
      "guides": []
     },
     {
      "id": "access.table.row-source",
      "name": "Row source",
      "guides": []
     },
     {
      "id": "access.table.limit-to-list",
      "name": "Limit to list",
      "guides": []
     },
     {
      "id": "access.table.setting-primary-key",
      "name": "Setting Primary key",
      "guides": [
       "access-cg1",
       "access-cg2",
       "access-ht1",
       "access-ht2"
      ]
     },
     {
      "id": "access.table.relations-between-tables",
      "name": "Relations between tables",
      "guides": [
       "access-cg1",
       "access-cg2",
       "access-ht1",
       "access-ht2"
      ]
     }
    ]
   },
   {
    "id": "report",
    "name": "Report",
    "skills": [
     {
      "id": "access.report.create-a-report",
      "name": "Create a report",
      "guides": [
       "access-cg4",
       "access-cg5",
       "access-ht4"
      ]
     },
     {
      "id": "access.report.sort",
      "name": "Sort",
      "guides": [
       "access-cg3",
       "access-cg4",
       "access-ht3",
       "access-ht4"
      ]
     },
     {
      "id": "access.report.sort-evidence",
      "name": "Sort Evidence",
      "guides": []
     },
     {
      "id": "access.report.delete-grouping",
      "name": "Delete Grouping",
      "guides": []
     },
     {
      "id": "access.report.add-title",
      "name": "Add Title",
      "guides": [
       "access-cg4",
       "access-ht4"
      ]
     },
     {
      "id": "access.report.totals",
      "name": "Totals",
      "guides": [
       "access-cg4",
       "access-cg5"
      ]
     },
     {
      "id": "access.report.add-caption",
      "name": "Add Caption",
      "guides": []
     },
     {
      "id": "access.report.insert-footer-header",
      "name": "Insert Footer & Header",
      "guides": [
       "access-cg4",
       "access-ht4"
      ]
     },
     {
      "id": "access.report.change-orientation",
      "name": "Change orientation",
      "guides": [
       "access-cg4",
       "access-ht4"
      ]
     },
     {
      "id": "access.report.printing",
      "name": "Printing",
      "guides": [
       "access-cg3",
       "access-cg4",
       "access-cg5",
       "access-ht1",
       "access-ht3",
       "access-ht4"
      ]
     },
     {
      "id": "access.report.remove-borders-if-appearing",
      "name": "Remove Borders if appearing",
      "guides": []
     }
    ]
   },
   {
    "id": "query",
    "name": "Query",
    "skills": [
     {
      "id": "access.query.create-query",
      "name": "Create Query",
      "guides": [
       "access-cg3",
       "access-ht3"
      ]
     },
     {
      "id": "access.query.criteria-include-text",
      "name": "Criteria — Include text",
      "guides": [
       "access-cg2",
       "access-cg4",
       "access-ht1",
       "access-ht2",
       "access-ht3",
       "access-ht4"
      ]
     },
     {
      "id": "access.query.criteria-begin-with",
      "name": "Criteria — Begin with",
      "guides": [
       "access-cg3",
       "access-ht3"
      ]
     },
     {
      "id": "access.query.criteria-end-with",
      "name": "Criteria — End with",
      "guides": []
     },
     {
      "id": "access.query.criteria-don-t-include",
      "name": "Criteria — Don't include",
      "guides": [
       "access-cg1",
       "access-cg2",
       "access-ht1"
      ]
     },
     {
      "id": "access.query.criteria-dates",
      "name": "Criteria — Dates",
      "guides": [
       "access-cg1",
       "access-cg2",
       "access-cg5",
       "access-ht1",
       "access-ht2"
      ]
     },
     {
      "id": "access.query.criteria-between",
      "name": "Criteria — Between",
      "guides": [
       "access-cg1",
       "access-cg2",
       "access-cg3",
       "access-cg5",
       "access-ht1",
       "access-ht2",
       "access-ht4"
      ]
     },
     {
      "id": "access.query.criteria-or",
      "name": "Criteria — OR",
      "guides": [
       "access-cg2",
       "access-cg3",
       "access-cg4",
       "access-cg5",
       "access-ht2",
       "access-ht3",
       "access-ht4"
      ]
     },
     {
      "id": "access.query.format-field-decimal-place",
      "name": "Format field decimal place",
      "guides": [
       "access-cg3",
       "access-ht3"
      ]
     },
     {
      "id": "access.query.builder",
      "name": "Builder",
      "guides": [
       "access-cg1"
      ]
     },
     {
      "id": "access.query.sorting",
      "name": "Sorting",
      "guides": [
       "access-cg3",
       "access-cg4",
       "access-ht3",
       "access-ht4"
      ]
     },
     {
      "id": "access.query.adding-non-appearing-field",
      "name": "Adding non-appearing field",
      "guides": []
     },
     {
      "id": "access.query.properties",
      "name": "Properties",
      "guides": []
     }
    ]
   },
   {
    "id": "data-entry-form",
    "name": "Data Entry Form",
    "skills": [
     {
      "id": "access.data-entry-form.setup-wizard",
      "name": "Setup Wizard",
      "guides": [
       "access-cg2",
       "access-ht2"
      ]
     },
     {
      "id": "access.data-entry-form.add-dropdown-list",
      "name": "Add Dropdown List",
      "guides": [
       "access-cg2",
       "access-ht2"
      ]
     },
     {
      "id": "access.data-entry-form.add-radio-buttons",
      "name": "Add Radio Buttons",
      "guides": [
       "access-cg2",
       "access-ht2"
      ]
     },
     {
      "id": "access.data-entry-form.add-multiple-choice-radio-button",
      "name": "Add multiple choice Radio Button",
      "guides": []
     }
    ]
   },
   {
    "id": "labels",
    "name": "Labels",
    "skills": [
     {
      "id": "access.labels.create-label",
      "name": "Create label",
      "guides": [
       "access-cg4",
       "access-ht4"
      ]
     },
     {
      "id": "access.labels.choose-dimensions",
      "name": "Choose Dimensions",
      "guides": []
     },
     {
      "id": "access.labels.6-label-dimensions",
      "name": "6-label dimensions",
      "guides": []
     },
     {
      "id": "access.labels.8-label-dimensions",
      "name": "8-label dimensions",
      "guides": []
     }
    ]
   },
   {
    "id": "summary",
    "name": "Summary",
    "skills": [
     {
      "id": "access.summary.create-summary",
      "name": "Create Summary",
      "guides": []
     },
     {
      "id": "access.summary.use-totals",
      "name": "Use Totals",
      "guides": [
       "access-cg4",
       "access-cg5"
      ]
     },
     {
      "id": "access.summary.count-records",
      "name": "Count Records",
      "guides": [
       "access-cg5",
       "access-ht1",
       "access-ht3"
      ]
     }
    ]
   },
   {
    "id": "validation",
    "name": "Validation",
    "skills": [
     {
      "id": "access.validation.existence",
      "name": "Existence",
      "guides": [
       "access-cg5"
      ]
     },
     {
      "id": "access.validation.text-length",
      "name": "Text Length",
      "guides": [
       "access-cg5"
      ]
     },
     {
      "id": "access.validation.numeric-length",
      "name": "Numeric Length",
      "guides": [
       "access-cg5"
      ]
     },
     {
      "id": "access.validation.range",
      "name": "Range",
      "guides": [
       "access-cg1",
       "access-cg2",
       "access-cg3",
       "access-cg5",
       "access-ht1",
       "access-ht2",
       "access-ht4"
      ]
     },
     {
      "id": "access.validation.presence",
      "name": "Presence",
      "guides": [
       "access-cg5"
      ]
     },
     {
      "id": "access.validation.format",
      "name": "Format",
      "guides": [
       "access-cg5"
      ]
     }
    ]
   }
  ]
 },
 {
  "id": "excel",
  "name": "Excel",
  "sub": "Spreadsheets & data modelling",
  "color": "#27a844",
  "categories": [
   {
    "id": "basic",
    "name": "Basic",
    "skills": [
     {
      "id": "excel.basic.inserting-rows-and-columns",
      "name": "Inserting rows and columns",
      "guides": [
       "excel-cg1",
       "excel-ht1"
      ]
     },
     {
      "id": "excel.basic.merging",
      "name": "Merging",
      "guides": []
     },
     {
      "id": "excel.basic.wrapping",
      "name": "Wrapping",
      "guides": []
     },
     {
      "id": "excel.basic.hiding",
      "name": "Hiding",
      "guides": [
       "excel-cg1",
       "excel-cg2",
       "excel-cg3",
       "excel-ht1",
       "excel-ht2",
       "excel-ht3"
      ]
     },
     {
      "id": "excel.basic.saving",
      "name": "Saving",
      "guides": [
       "excel-cg1",
       "excel-cg2",
       "excel-cg3",
       "excel-cg4",
       "excel-ht1",
       "excel-ht2",
       "excel-ht3",
       "excel-ht4"
      ]
     },
     {
      "id": "excel.basic.inserting-header",
      "name": "Inserting header",
      "guides": [
       "excel-cg1",
       "excel-cg2",
       "excel-cg4",
       "excel-ht1",
       "excel-ht2",
       "excel-ht4"
      ]
     },
     {
      "id": "excel.basic.print-with-without-headings",
      "name": "Print — with / without headings",
      "guides": [
       "excel-cg2",
       "excel-ht2"
      ]
     },
     {
      "id": "excel.basic.print-with-without-gridlines",
      "name": "Print — with / without gridlines",
      "guides": [
       "excel-cg2",
       "excel-ht2"
      ]
     },
     {
      "id": "excel.basic.print-selection-only",
      "name": "Print selection only",
      "guides": [
       "excel-cg2",
       "excel-ht2"
      ]
     },
     {
      "id": "excel.basic.scaling-to-1-page",
      "name": "Scaling to 1 page",
      "guides": [
       "excel-cg1",
       "excel-cg2",
       "excel-cg3",
       "excel-ht1",
       "excel-ht2",
       "excel-ht3"
      ]
     }
    ]
   },
   {
    "id": "main-concepts",
    "name": "Main Concepts",
    "skills": [
     {
      "id": "excel.main-concepts.cell-referencing",
      "name": "Cell referencing",
      "guides": [
       "excel-cg2",
       "excel-ht2"
      ]
     },
     {
      "id": "excel.main-concepts.cell-naming",
      "name": "Cell naming",
      "guides": [
       "excel-cg1",
       "excel-ht1",
       "excel-ht4"
      ]
     },
     {
      "id": "excel.main-concepts.conditional-formatting",
      "name": "Conditional Formatting",
      "guides": [
       "excel-cg4",
       "excel-ht4"
      ]
     },
     {
      "id": "excel.main-concepts.formatting",
      "name": "Formatting",
      "guides": [
       "excel-cg1",
       "excel-cg4",
       "excel-ht1",
       "excel-ht4"
      ]
     },
     {
      "id": "excel.main-concepts.interrogation-filter",
      "name": "Interrogation (Filter)",
      "guides": [
       "excel-cg2",
       "excel-ht2"
      ]
     },
     {
      "id": "excel.main-concepts.nested-if",
      "name": "Nested IF",
      "guides": [
       "excel-cg4",
       "excel-ht4"
      ]
     }
    ]
   },
   {
    "id": "excel-functions",
    "name": "Excel Functions",
    "skills": [
     {
      "id": "excel.excel-functions.power",
      "name": "Power ^",
      "guides": []
     },
     {
      "id": "excel.excel-functions.sum",
      "name": "SUM",
      "guides": [
       "excel-cg1",
       "excel-cg2",
       "excel-ht1",
       "excel-ht2",
       "excel-ht3",
       "excel-ht4"
      ]
     },
     {
      "id": "excel.excel-functions.min",
      "name": "MIN",
      "guides": [
       "excel-cg1",
       "excel-ht1"
      ]
     },
     {
      "id": "excel.excel-functions.max",
      "name": "MAX",
      "guides": [
       "excel-cg1",
       "excel-ht1"
      ]
     },
     {
      "id": "excel.excel-functions.average",
      "name": "AVERAGE",
      "guides": [
       "excel-cg1",
       "excel-cg2",
       "excel-ht1",
       "excel-ht2"
      ]
     },
     {
      "id": "excel.excel-functions.round",
      "name": "ROUND",
      "guides": [
       "excel-cg1",
       "excel-cg2",
       "excel-ht1",
       "excel-ht2"
      ]
     },
     {
      "id": "excel.excel-functions.roundup",
      "name": "ROUNDUP",
      "guides": []
     },
     {
      "id": "excel.excel-functions.rounddown",
      "name": "ROUNDDOWN",
      "guides": []
     },
     {
      "id": "excel.excel-functions.int",
      "name": "INT",
      "guides": []
     },
     {
      "id": "excel.excel-functions.count",
      "name": "COUNT",
      "guides": [
       "excel-cg1",
       "excel-ht1",
       "excel-ht4"
      ]
     },
     {
      "id": "excel.excel-functions.counta",
      "name": "COUNTA",
      "guides": []
     },
     {
      "id": "excel.excel-functions.countif",
      "name": "COUNTIF",
      "guides": [
       "excel-cg2",
       "excel-ht2"
      ]
     },
     {
      "id": "excel.excel-functions.countifs",
      "name": "COUNTIFS",
      "guides": [
       "excel-cg2",
       "excel-ht4"
      ]
     },
     {
      "id": "excel.excel-functions.sumif",
      "name": "SUMIF",
      "guides": [
       "excel-cg2",
       "excel-ht2"
      ]
     },
     {
      "id": "excel.excel-functions.sumifs",
      "name": "SUMIFS",
      "guides": []
     },
     {
      "id": "excel.excel-functions.averageif",
      "name": "AVERAGEIF",
      "guides": [
       "excel-cg2",
       "excel-ht2"
      ]
     },
     {
      "id": "excel.excel-functions.hlookup",
      "name": "HLOOKUP",
      "guides": []
     },
     {
      "id": "excel.excel-functions.vlookup",
      "name": "VLOOKUP",
      "guides": [
       "excel-cg3",
       "excel-ht3"
      ]
     },
     {
      "id": "excel.excel-functions.xlookup",
      "name": "XLOOKUP",
      "guides": [
       "excel-cg3",
       "excel-ht3"
      ]
     },
     {
      "id": "excel.excel-functions.if",
      "name": "IF",
      "guides": [
       "excel-cg4",
       "excel-ht4"
      ]
     },
     {
      "id": "excel.excel-functions.and",
      "name": "AND",
      "guides": []
     },
     {
      "id": "excel.excel-functions.show-hide-functions",
      "name": "Show / Hide Functions",
      "guides": [
       "excel-cg1",
       "excel-cg2",
       "excel-cg3",
       "excel-cg4",
       "excel-ht1",
       "excel-ht2",
       "excel-ht3",
       "excel-ht4"
      ]
     }
    ]
   },
   {
    "id": "charts",
    "name": "Charts",
    "skills": [
     {
      "id": "excel.charts.bar-chart",
      "name": "Bar chart",
      "guides": [
       "excel-cg3",
       "excel-ht3"
      ]
     },
     {
      "id": "excel.charts.pie-chart",
      "name": "Pie chart",
      "guides": [
       "excel-cg3",
       "excel-ht3"
      ]
     },
     {
      "id": "excel.charts.line-chart",
      "name": "Line chart",
      "guides": []
     },
     {
      "id": "excel.charts.double-axes-chart",
      "name": "Double axes chart",
      "guides": []
     },
     {
      "id": "excel.charts.combo-chart",
      "name": "Combo Chart",
      "guides": [
       "excel-cg3",
       "excel-ht3"
      ]
     },
     {
      "id": "excel.charts.chart-concepts-legend",
      "name": "Chart concepts — Legend",
      "guides": [
       "excel-cg3",
       "excel-ht3"
      ]
     },
     {
      "id": "excel.charts.chart-concepts-axis-titles",
      "name": "Chart concepts — Axis titles",
      "guides": [
       "excel-cg3",
       "excel-ht3"
      ]
     },
     {
      "id": "excel.charts.chart-concepts-title",
      "name": "Chart concepts — Title",
      "guides": [
       "excel-cg3",
       "excel-ht3"
      ]
     },
     {
      "id": "excel.charts.chart-concepts-data-labels",
      "name": "Chart concepts — Data labels",
      "guides": [
       "excel-ht3"
      ]
     },
     {
      "id": "excel.charts.chart-concepts-data-labels-placement",
      "name": "Chart concepts — Data labels placement",
      "guides": [
       "excel-ht3"
      ]
     },
     {
      "id": "excel.charts.chart-concepts-increments",
      "name": "Chart concepts — Increments",
      "guides": [
       "excel-cg3",
       "excel-ht3"
      ]
     },
     {
      "id": "excel.charts.chart-concepts-min-max",
      "name": "Chart concepts — Min / Max",
      "guides": [
       "excel-ht1"
      ]
     },
     {
      "id": "excel.charts.chart-concepts-secondary-axis",
      "name": "Chart concepts — Secondary axis",
      "guides": [
       "excel-cg3",
       "excel-ht3"
      ]
     }
    ]
   }
  ]
 },
 {
  "id": "sharepoint",
  "name": "SharePoint",
  "sub": "Web authoring & integration",
  "color": "#9a45a8",
  "categories": [
   {
    "id": "basic",
    "name": "Basic",
    "skills": [
     {
      "id": "sharepoint.basic.open-site",
      "name": "Open site",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg2",
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht1",
       "sharepoint-ht2",
       "sharepoint-ht3"
      ]
     },
     {
      "id": "sharepoint.basic.adding-css",
      "name": "Adding CSS",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht1",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.basic.adding-html",
      "name": "Adding HTML",
      "guides": [
       "sharepoint-cg2",
       "sharepoint-cg4",
       "sharepoint-ht2"
      ]
     },
     {
      "id": "sharepoint.basic.preview-in-browser",
      "name": "Preview in browser",
      "guides": [
       "sharepoint-cg2",
       "sharepoint-ht2"
      ]
     },
     {
      "id": "sharepoint.basic.switching-code-design-view",
      "name": "Switching Code & Design view",
      "guides": []
     },
     {
      "id": "sharepoint.basic.saving",
      "name": "Saving",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg2",
       "sharepoint-cg3",
       "sharepoint-ht1",
       "sharepoint-ht2",
       "sharepoint-ht3"
      ]
     }
    ]
   },
   {
    "id": "main-selectors",
    "name": "Main Selectors",
    "skills": [
     {
      "id": "sharepoint.main-selectors.p-selector",
      "name": "P selector",
      "guides": [
       "sharepoint-cg1"
      ]
     },
     {
      "id": "sharepoint.main-selectors.h1-to-h6",
      "name": "H1 to H6",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht1",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.main-selectors.i-italic",
      "name": "i (italic)",
      "guides": []
     },
     {
      "id": "sharepoint.main-selectors.u-underline",
      "name": "u (underline)",
      "guides": []
     },
     {
      "id": "sharepoint.main-selectors.ol-ordered-list",
      "name": "ol (ordered list)",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-ht1"
      ]
     },
     {
      "id": "sharepoint.main-selectors.ul-unordered-list",
      "name": "ul (unordered list)",
      "guides": [
       "sharepoint-cg4",
       "sharepoint-ht1"
      ]
     },
     {
      "id": "sharepoint.main-selectors.li-list-item",
      "name": "li (list item)",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg4",
       "sharepoint-ht1"
      ]
     },
     {
      "id": "sharepoint.main-selectors.class-selector-class",
      "name": "Class selector (.class)",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg2",
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht4"
      ]
     }
    ]
   },
   {
    "id": "font-selectors",
    "name": "Font Selectors",
    "skills": [
     {
      "id": "sharepoint.font-selectors.font-family",
      "name": "font-family",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht1",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.font-selectors.default-font-family",
      "name": "Default font family",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht1",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.font-selectors.font-size",
      "name": "font-size",
      "guides": []
     },
     {
      "id": "sharepoint.font-selectors.size-units-px-pt-em",
      "name": "Size units (px, pt, em, %)",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht1",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.font-selectors.font-weight",
      "name": "font-weight",
      "guides": [
       "sharepoint-cg4",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.font-selectors.font-style",
      "name": "font-style",
      "guides": []
     },
     {
      "id": "sharepoint.font-selectors.text-transform",
      "name": "text-transform",
      "guides": []
     },
     {
      "id": "sharepoint.font-selectors.text-decoration",
      "name": "text-decoration",
      "guides": []
     },
     {
      "id": "sharepoint.font-selectors.text-align",
      "name": "text-align",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg4",
       "sharepoint-ht1",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.font-selectors.text-indent",
      "name": "text-indent",
      "guides": []
     },
     {
      "id": "sharepoint.font-selectors.list-style",
      "name": "list-style",
      "guides": [
       "sharepoint-cg4",
       "sharepoint-ht1"
      ]
     }
    ]
   },
   {
    "id": "background",
    "name": "Background",
    "skills": [
     {
      "id": "sharepoint.background.background-color",
      "name": "background-color",
      "guides": [
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.background.background-image",
      "name": "background-image",
      "guides": []
     },
     {
      "id": "sharepoint.background.background-repeat",
      "name": "background-repeat",
      "guides": [
       "sharepoint-cg4"
      ]
     }
    ]
   },
   {
    "id": "table-css",
    "name": "Table (CSS)",
    "skills": [
     {
      "id": "sharepoint.table-css.width",
      "name": "width",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg2",
       "sharepoint-ht1",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.table-css.border-style",
      "name": "border-style",
      "guides": [
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.table-css.border-width",
      "name": "border-width",
      "guides": [
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.table-css.border-color",
      "name": "border-color",
      "guides": [
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.table-css.margin-cell",
      "name": "margin (cell)",
      "guides": [
       "sharepoint-cg4",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.table-css.padding-cell",
      "name": "padding (cell)",
      "guides": [
       "sharepoint-cg4",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.table-css.table-positioning",
      "name": "table positioning",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg4",
       "sharepoint-ht1",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.table-css.border-collapse",
      "name": "border-collapse",
      "guides": [
       "sharepoint-cg4",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.table-css.border-spacing",
      "name": "border-spacing",
      "guides": [
       "sharepoint-cg4",
       "sharepoint-ht4"
      ]
     }
    ]
   },
   {
    "id": "styles",
    "name": "Styles",
    "skills": [
     {
      "id": "sharepoint.styles.applying-styles",
      "name": "Applying Styles",
      "guides": []
     },
     {
      "id": "sharepoint.styles.modifying-styles",
      "name": "Modifying Styles",
      "guides": []
     },
     {
      "id": "sharepoint.styles.attaching-css-to-html",
      "name": "Attaching CSS to HTML",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht1",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.styles.css-priority-specificity",
      "name": "CSS Priority (specificity)",
      "guides": [
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     }
    ]
   },
   {
    "id": "html-tables",
    "name": "HTML: Tables",
    "skills": [
     {
      "id": "sharepoint.html-tables.inserting-table",
      "name": "Inserting Table",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg2",
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht1",
       "sharepoint-ht2",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.html-tables.specify-rows-columns",
      "name": "Specify Rows & Columns",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg2",
       "sharepoint-cg4",
       "sharepoint-ht1",
       "sharepoint-ht2",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.html-tables.alignment",
      "name": "Alignment",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg4",
       "sharepoint-ht1",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.html-tables.specifying-width",
      "name": "Specifying Width",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg2",
       "sharepoint-ht1",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.html-tables.applying-header-cell-th",
      "name": "Applying Header Cell (th)",
      "guides": [
       "sharepoint-cg2",
       "sharepoint-cg4",
       "sharepoint-ht2"
      ]
     },
     {
      "id": "sharepoint.html-tables.merge-cells-colspan-rowspan",
      "name": "Merge Cells (colspan / rowspan)",
      "guides": [
       "sharepoint-cg2",
       "sharepoint-ht4"
      ]
     }
    ]
   },
   {
    "id": "inserting",
    "name": "Inserting",
    "skills": [
     {
      "id": "sharepoint.inserting.video",
      "name": "Video",
      "guides": [
       "sharepoint-cg2"
      ]
     },
     {
      "id": "sharepoint.inserting.audio",
      "name": "Audio",
      "guides": [
       "sharepoint-cg2"
      ]
     },
     {
      "id": "sharepoint.inserting.bookmark",
      "name": "Bookmark",
      "guides": [
       "sharepoint-cg2",
       "sharepoint-cg4",
       "sharepoint-ht2",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.inserting.pictures",
      "name": "Pictures",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg2",
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht1",
       "sharepoint-ht2",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.inserting.alt-text",
      "name": "ALT-Text",
      "guides": [
       "sharepoint-cg4"
      ]
     },
     {
      "id": "sharepoint.inserting.hyperlink-existing-file",
      "name": "Hyperlink — Existing File",
      "guides": [
       "sharepoint-cg2",
       "sharepoint-ht2",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.inserting.hyperlink-existing-webpage-on-internet",
      "name": "Hyperlink — Existing Webpage on Internet",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg2",
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht2",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.inserting.hyperlink-anchor",
      "name": "Hyperlink — Anchor",
      "guides": [
       "sharepoint-cg2",
       "sharepoint-cg4",
       "sharepoint-ht2",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.inserting.hyperlink-new-file-or-webpage",
      "name": "Hyperlink — New File or Webpage",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg3",
       "sharepoint-ht1",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.inserting.hyperlink-email",
      "name": "Hyperlink — Email",
      "guides": [
       "sharepoint-cg2",
       "sharepoint-cg4",
       "sharepoint-ht2",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.inserting.target-frame-same-page",
      "name": "Target Frame — Same Page",
      "guides": [
       "sharepoint-cg2",
       "sharepoint-ht2"
      ]
     },
     {
      "id": "sharepoint.inserting.target-frame-new-window",
      "name": "Target Frame — New Window",
      "guides": [
       "sharepoint-cg2",
       "sharepoint-ht2"
      ]
     },
     {
      "id": "sharepoint.inserting.target-frame-default-target-frame",
      "name": "Target Frame — Default Target Frame",
      "guides": [
       "sharepoint-cg2",
       "sharepoint-ht2"
      ]
     },
     {
      "id": "sharepoint.inserting.target-frame-custom-setting",
      "name": "Target Frame — Custom Setting",
      "guides": [
       "sharepoint-cg2",
       "sharepoint-ht2"
      ]
     }
    ]
   },
   {
    "id": "meta-data",
    "name": "Meta-data",
    "skills": [
     {
      "id": "sharepoint.meta-data.page-title",
      "name": "Page Title",
      "guides": [
       "sharepoint-cg4"
      ]
     },
     {
      "id": "sharepoint.meta-data.page-description",
      "name": "Page Description",
      "guides": []
     },
     {
      "id": "sharepoint.meta-data.keywords",
      "name": "Keywords",
      "guides": [
       "sharepoint-cg4",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.meta-data.adding-user-variables",
      "name": "Adding User Variables",
      "guides": []
     },
     {
      "id": "sharepoint.meta-data.html-encoding",
      "name": "HTML Encoding",
      "guides": [
       "sharepoint-cg4",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.meta-data.viewport",
      "name": "ViewPort",
      "guides": []
     }
    ]
   },
   {
    "id": "image-processing",
    "name": "Image Processing",
    "skills": [
     {
      "id": "sharepoint.image-processing.flip-horizontally",
      "name": "Flip Horizontally",
      "guides": []
     },
     {
      "id": "sharepoint.image-processing.flip-vertically",
      "name": "Flip Vertically",
      "guides": []
     },
     {
      "id": "sharepoint.image-processing.rotate",
      "name": "Rotate",
      "guides": []
     },
     {
      "id": "sharepoint.image-processing.cropping",
      "name": "Cropping",
      "guides": []
     },
     {
      "id": "sharepoint.image-processing.resizing",
      "name": "Resizing",
      "guides": [
       "sharepoint-cg3",
       "sharepoint-ht3"
      ]
     },
     {
      "id": "sharepoint.image-processing.maintain-aspect-ratio",
      "name": "Maintain Aspect Ratio",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg3",
       "sharepoint-ht1",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.image-processing.adding-text-to-image",
      "name": "Adding Text to image",
      "guides": []
     },
     {
      "id": "sharepoint.image-processing.adjust-brightness-contrast",
      "name": "Adjust Brightness & Contrast",
      "guides": []
     },
     {
      "id": "sharepoint.image-processing.saving-in-other-formats",
      "name": "Saving in other formats",
      "guides": [
       "sharepoint-cg1",
       "sharepoint-cg3",
       "sharepoint-cg4",
       "sharepoint-ht1",
       "sharepoint-ht3",
       "sharepoint-ht4"
      ]
     },
     {
      "id": "sharepoint.image-processing.16-bit-color-system",
      "name": "16-bit color system",
      "guides": [
       "sharepoint-cg3"
      ]
     },
     {
      "id": "sharepoint.image-processing.8-bit-color-system",
      "name": "8-bit color system",
      "guides": [
       "sharepoint-ht3"
      ]
     }
    ]
   }
  ]
 }
];

export const GUIDES = [
 {
  "id": "word-cg1",
  "app": "word",
  "kind": "guide",
  "no": 1,
  "label": "Class Guide 1",
  "minutes": 30,
  "page": 5,
  "brief": "Create a folder on your desktop named First Guide.",
  "tags": [
   "Columns",
   "Headers & footers",
   "Page setup",
   "Images",
   "Lists"
  ]
 },
 {
  "id": "word-cg2",
  "app": "word",
  "kind": "guide",
  "no": 2,
  "label": "Class Guide 2",
  "minutes": 40,
  "page": 8,
  "brief": "Using Microsoft Office Word, open the file COLDHOUSE.rtf.",
  "tags": [
   "Headers & footers",
   "Images",
   "House styles",
   "Sub/superscript"
  ]
 },
 {
  "id": "word-ht1",
  "app": "word",
  "kind": "task",
  "no": 1,
  "label": "Home Task 1",
  "minutes": 35,
  "page": 11,
  "brief": "Using Microsoft Office Word, open the file COFFEE.rtf.",
  "tags": [
   "Columns",
   "Headers & footers",
   "Page setup",
   "Images",
   "Find & replace"
  ]
 },
 {
  "id": "word-ht2",
  "app": "word",
  "kind": "task",
  "no": 2,
  "label": "Home Task 2",
  "minutes": 40,
  "page": 13,
  "brief": "Using Microsoft Office Word, open the file PizzaStore.rtf.",
  "tags": [
   "Headers & footers",
   "Images",
   "House styles",
   "Sub/superscript"
  ]
 },
 {
  "id": "powerpoint-cg1",
  "app": "powerpoint",
  "kind": "guide",
  "no": 1,
  "label": "Class Guide 1",
  "minutes": 25,
  "page": 17,
  "brief": "Create a new presentation consisting of 3 slides.",
  "tags": [
   "Images",
   "Lists",
   "Master slides"
  ]
 },
 {
  "id": "powerpoint-cg2",
  "app": "powerpoint",
  "kind": "guide",
  "no": 2,
  "label": "Class Guide 2",
  "minutes": 25,
  "page": 19,
  "brief": "Create a new master slide that includes:",
  "tags": [
   "Images",
   "Lists",
   "Master slides",
   "Transitions",
   "Slide outputs"
  ]
 },
 {
  "id": "powerpoint-ht1",
  "app": "powerpoint",
  "kind": "task",
  "no": 1,
  "label": "Home Task 1",
  "minutes": 25,
  "page": 22,
  "brief": "Create a new presentation consisting of 2 slides.",
  "tags": [
   "Images",
   "Lists",
   "Master slides"
  ]
 },
 {
  "id": "powerpoint-ht2",
  "app": "powerpoint",
  "kind": "task",
  "no": 2,
  "label": "Home Task 2",
  "minutes": 35,
  "page": 24,
  "brief": "Create a master slide that includes:",
  "tags": [
   "Images",
   "Lists",
   "Master slides",
   "Transitions",
   "Slide outputs"
  ]
 },
 {
  "id": "access-cg1",
  "app": "access",
  "kind": "guide",
  "no": 1,
  "label": "Class Guide 1",
  "minutes": 20,
  "page": 27,
  "brief": "Using suitable database software, create a new database ca",
  "tags": [
   "Database setup",
   "Primary keys",
   "Data types"
  ]
 },
 {
  "id": "access-cg2",
  "app": "access",
  "kind": "guide",
  "no": 2,
  "label": "Class Guide 2",
  "minutes": 25,
  "page": 29,
  "brief": "Create a new database called Unidots Co, then import the f",
  "tags": [
   "Database setup",
   "Primary keys",
   "Forms",
   "Data import"
  ]
 },
 {
  "id": "access-cg3",
  "app": "access",
  "kind": "guide",
  "no": 3,
  "label": "Class Guide 3",
  "minutes": 30,
  "page": 32,
  "brief": "Open the database saved in Unidots DB.",
  "tags": [
   "Database setup",
   "Queries",
   "Number formats"
  ]
 },
 {
  "id": "access-cg4",
  "app": "access",
  "kind": "guide",
  "no": 4,
  "label": "Class Guide 4",
  "minutes": 35,
  "page": 34,
  "brief": "Open the database saved in Unidots DB.",
  "tags": [
   "Database setup",
   "Number formats",
   "Reports"
  ]
 },
 {
  "id": "access-cg5",
  "app": "access",
  "kind": "guide",
  "no": 5,
  "label": "Class Guide 5",
  "minutes": 15,
  "page": 37,
  "brief": "Import the file Car Managing.CSV with appropriate data typ",
  "tags": [
   "Database setup",
   "Data import",
   "Reports",
   "Validation"
  ]
 },
 {
  "id": "access-ht1",
  "app": "access",
  "kind": "task",
  "no": 1,
  "label": "Home Task 1",
  "minutes": 10,
  "page": 39,
  "brief": "Create a new database called Operational and import the fi",
  "tags": [
   "Database setup",
   "Primary keys",
   "Data import"
  ]
 },
 {
  "id": "access-ht2",
  "app": "access",
  "kind": "task",
  "no": 2,
  "label": "Home Task 2",
  "minutes": 25,
  "page": 41,
  "brief": "Create a new database called ICTCO DB and import the file",
  "tags": [
   "Database setup",
   "Primary keys",
   "Forms",
   "Data import"
  ]
 },
 {
  "id": "access-ht3",
  "app": "access",
  "kind": "task",
  "no": 3,
  "label": "Home Task 3",
  "minutes": 30,
  "page": 44,
  "brief": "Open the database saved in Task 2 to start selecting data",
  "tags": [
   "Database setup",
   "Queries",
   "Number formats"
  ]
 },
 {
  "id": "access-ht4",
  "app": "access",
  "kind": "task",
  "no": 4,
  "label": "Home Task 4",
  "minutes": 35,
  "page": 47,
  "brief": "Open the database saved in Task 2 folder to start working",
  "tags": [
   "Database setup",
   "Reports"
  ]
 },
 {
  "id": "excel-cg1",
  "app": "excel",
  "kind": "guide",
  "no": 1,
  "label": "Class Guide 1",
  "minutes": 30,
  "page": 50,
  "brief": "Open the file Events.csv and save it as Events followed by",
  "tags": [
   "Headers & footers",
   "Page setup",
   "Data import",
   "Formulas",
   "Spreadsheets"
  ]
 },
 {
  "id": "excel-cg2",
  "app": "excel",
  "kind": "guide",
  "no": 2,
  "label": "Class Guide 2",
  "minutes": 15,
  "page": 52,
  "brief": "Open the file saved in Guide 1 to continue working on it.",
  "tags": [
   "Headers & footers",
   "Formulas",
   "Spreadsheets",
   "Sort & filter"
  ]
 },
 {
  "id": "excel-cg3",
  "app": "excel",
  "kind": "guide",
  "no": 3,
  "label": "Class Guide 3",
  "minutes": 25,
  "page": 54,
  "brief": "Open the file saved in Guide 2.",
  "tags": [
   "Page setup",
   "Data import",
   "Formulas",
   "Spreadsheets",
   "Charts"
  ]
 },
 {
  "id": "excel-cg4",
  "app": "excel",
  "kind": "guide",
  "no": 4,
  "label": "Class Guide 4",
  "minutes": 15,
  "page": 56,
  "brief": "Open the file saved in Guide 3.",
  "tags": [
   "Headers & footers",
   "Formulas",
   "Spreadsheets"
  ]
 },
 {
  "id": "excel-ht1",
  "app": "excel",
  "kind": "task",
  "no": 1,
  "label": "Home Task 1",
  "minutes": 35,
  "page": 58,
  "brief": "Open the file Unidots.csv and save it as Unidots followed",
  "tags": [
   "Headers & footers",
   "Data import",
   "Formulas",
   "Spreadsheets"
  ]
 },
 {
  "id": "excel-ht2",
  "app": "excel",
  "kind": "task",
  "no": 2,
  "label": "Home Task 2",
  "minutes": 15,
  "page": 61,
  "brief": "Open the file saved in Task 1.",
  "tags": [
   "Headers & footers",
   "Formulas",
   "Spreadsheets",
   "Sort & filter"
  ]
 },
 {
  "id": "excel-ht3",
  "app": "excel",
  "kind": "task",
  "no": 3,
  "label": "Home Task 3",
  "minutes": 25,
  "page": 63,
  "brief": "Open the file saved in Task 2 to continue working on it.",
  "tags": [
   "Page setup",
   "Data import",
   "Formulas",
   "Spreadsheets",
   "Charts"
  ]
 },
 {
  "id": "excel-ht4",
  "app": "excel",
  "kind": "task",
  "no": 4,
  "label": "Home Task 4",
  "minutes": 20,
  "page": 65,
  "brief": "Open the file saved in Task 3 to continue working on it.",
  "tags": [
   "Headers & footers",
   "Formulas",
   "Spreadsheets"
  ]
 },
 {
  "id": "sharepoint-cg1",
  "app": "sharepoint",
  "kind": "guide",
  "no": 1,
  "label": "Class Guide 1",
  "minutes": 25,
  "page": 68,
  "brief": "Use the following files within your website:",
  "tags": [
   "Images",
   "CSS",
   "HTML",
   "Tables"
  ]
 },
 {
  "id": "sharepoint-cg2",
  "app": "sharepoint",
  "kind": "guide",
  "no": 2,
  "label": "Class Guide 2",
  "minutes": 25,
  "page": 71,
  "brief": "Create a new document called Evidence.",
  "tags": [
   "Images",
   "HTML",
   "Tables",
   "Hyperlinks"
  ]
 },
 {
  "id": "sharepoint-cg3",
  "app": "sharepoint",
  "kind": "guide",
  "no": 3,
  "label": "Class Guide 3",
  "minutes": 25,
  "page": 73,
  "brief": "Use the following files within your website:",
  "tags": [
   "Images",
   "CSS",
   "HTML",
   "Tables"
  ]
 },
 {
  "id": "sharepoint-cg4",
  "app": "sharepoint",
  "kind": "guide",
  "no": 4,
  "label": "Class Guide 4",
  "minutes": 35,
  "page": 76,
  "brief": "Use the following files within your website:",
  "tags": [
   "Images",
   "CSS",
   "HTML",
   "Tables",
   "Hyperlinks"
  ]
 },
 {
  "id": "sharepoint-ht1",
  "app": "sharepoint",
  "kind": "task",
  "no": 1,
  "label": "Home Task 1",
  "minutes": 25,
  "page": 80,
  "brief": "Use the following files within your website:",
  "tags": [
   "Images",
   "CSS",
   "HTML",
   "Tables"
  ]
 },
 {
  "id": "sharepoint-ht2",
  "app": "sharepoint",
  "kind": "task",
  "no": 2,
  "label": "Home Task 2",
  "minutes": 20,
  "page": 83,
  "brief": "Create a new document called Evidence.",
  "tags": [
   "Images",
   "HTML",
   "Tables",
   "Hyperlinks"
  ]
 },
 {
  "id": "sharepoint-ht3",
  "app": "sharepoint",
  "kind": "task",
  "no": 3,
  "label": "Home Task 3",
  "minutes": 20,
  "page": 85,
  "brief": "Create a new evidence document and name it Evidence.",
  "tags": [
   "Images",
   "CSS",
   "HTML",
   "Tables"
  ]
 },
 {
  "id": "sharepoint-ht4",
  "app": "sharepoint",
  "kind": "task",
  "no": 4,
  "label": "Home Task 4",
  "minutes": 60,
  "page": 87,
  "brief": "Create a new stylesheet called ST-1907",
  "tags": [
   "Images",
   "CSS",
   "HTML",
   "Tables",
   "Hyperlinks"
  ]
 }
];
