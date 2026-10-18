// app/mains-roadmap/data/art-culture.js

export const ART_CULTURE_SUBJECT = {
  id: "gs1-art-culture",
  paper: "GS I",
  subject: "Art and Culture",
  title: "भारतीय कला एवं संस्कृति",

  stages: [
    {
      id: "prepare",
      title: "Topic Preparation",
      description: "Theme ke concepts aur dimensions padho.",
    },
    {
      id: "revision",
      title: "Revision & PYQ",
      description: "Notes revise karke mapped PYQs solve karo.",
    },
    {
      id: "writing",
      title: "Answer Writing",
      description: "PYQs ke Mains-oriented answers likho.",
    },
    {
      id: "evaluation",
      title: "AI Evaluation",
      description: "Feedback review karo aur mistakes improve karo.",
    },
  ],

  themes: [
    {
      id: "temple-rock-cut-architecture",
      title: "मंदिर एवं शैलकृत वास्तुकला",
      priority: "pending-analysis",

      match: {
        topics: ["Architecture"],
        keywords: [
          "temple architecture",
          "chola architecture",
          "rock-cut architecture",
          "mesolithic rock cut architecture",
        ],
      },

      studyTasks: [
        {
          id: "architecture-basics",
          title: "वास्तुकला की मूल अवधारणाएँ",
          items: [
            "भारतीय वास्तुकला की प्रमुख विशेषताएँ",
            "मंदिर के प्रमुख भाग और उनकी भूमिका",
            "वास्तुकला का धार्मिक एवं सामाजिक संदर्भ",
          ],
        },
        {
          id: "temple-styles",
          title: "मंदिर वास्तुकला की शैलियाँ",
          items: [
            "नागर शैली: विशेषताएँ और क्षेत्रीय विविधताएँ",
            "द्रविड़ शैली: विशेषताएँ और प्रमुख घटक",
            "वेसर शैली: विशेषताएँ और उदाहरण",
            "तीनों शैलियों की तुलनात्मक तालिका",
          ],
        },
        {
          id: "rock-cut",
          title: "शैलकृत वास्तुकला",
          items: [
            "शैलकृत वास्तुकला का विकास",
            "गुफाओं और शैलकृत स्मारकों की विशेषताएँ",
            "कला, इतिहास और तत्कालीन जीवन के स्रोत के रूप में महत्व",
          ],
        },
        {
          id: "architecture-answer",
          title: "Mains Answer Framework",
          items: [
            "वास्तुकला आधारित प्रश्न की demand पहचानना",
            "उदाहरण और labelled diagram का उपयोग",
            "150 और 250 शब्दों के उत्तर की रूपरेखा बनाना",
          ],
        },
      ],

      completion: {
        studyTasks: true,
        mappedPyqsAttempted: true,
        answerWritingCompleted: true,
        evaluationReviewed: true,
      },
    },

    {
      id: "sculpture-art-schools",
      title: "मूर्तिकला एवं कला की प्रमुख शैलियाँ",
      priority: "pending-analysis",

      match: {
        topics: ["Sculpture", "Influence of art"],
        keywords: [
          "sculpture",
          "gandhara art",
          "buddhist stupa-art",
          "buddhist stupa art",
          "temple sculptures",
          "numismatic art",
        ],
      },

      studyTasks: [
        {
          id: "sculpture-basics",
          title: "मूर्तिकला की मूल अवधारणाएँ",
          items: [
            "भारतीय मूर्तिकला की प्रमुख विशेषताएँ",
            "मूर्तिकला में धार्मिक और लौकिक विषय",
            "प्रयुक्त सामग्री, तकनीक और प्रतीक",
          ],
        },
        {
          id: "art-schools",
          title: "प्रमुख कला-शैलियाँ",
          items: [
            "गांधार कला: विशेषताएँ और बाहरी प्रभाव",
            "मथुरा कला: प्रमुख विशेषताएँ",
            "अमरावती कला: प्रमुख विशेषताएँ",
            "तीनों कला-शैलियों की तुलना",
          ],
        },
        {
          id: "sculpture-context",
          title: "कला और समाज",
          items: [
            "बौद्ध स्तूप कला और उसके प्रतीक",
            "मंदिर मूर्तियों से सामाजिक जीवन की जानकारी",
            "गुप्तकालीन सिक्का-कला की विशेषताएँ",
          ],
        },
        {
          id: "sculpture-answer",
          title: "Mains Answer Framework",
          items: [
            "शैली की विशेषताएँ और उदाहरण जोड़ना",
            "भारतीय तथा विदेशी प्रभावों का विश्लेषण",
            "तुलनात्मक उत्तर और diagram तैयार करना",
          ],
        },
      ],

      completion: {
        studyTasks: true,
        mappedPyqsAttempted: true,
        answerWritingCompleted: true,
        evaluationReviewed: true,
      },
    },

    {
      id: "literature-cultural-traditions",
      title: "भारतीय साहित्य एवं सांस्कृतिक परंपराएँ",
      priority: "pending-analysis",

      match: {
        topics: ["Literature", "Religious practice"],
        keywords: [
          "sangam literature",
          "persian literary sources",
          "bhakti literature",
          "sufi",
          "mystic saints",
          "chaitanya mahaprabhu",
          "patron of learning and literature",
        ],
      },

      studyTasks: [
        {
          id: "literature-periods",
          title: "साहित्य की प्रमुख परंपराएँ",
          items: [
            "संगम साहित्य और तत्कालीन समाज",
            "मध्यकालीन फारसी साहित्य के स्रोत",
            "भक्ति साहित्य की प्रकृति और योगदान",
          ],
        },
        {
          id: "bhakti-sufi",
          title: "भक्ति एवं सूफी परंपराएँ",
          items: [
            "भक्ति आंदोलन की प्रमुख विशेषताएँ",
            "प्रमुख संतों और विचारधाराओं का योगदान",
            "समाज और संस्कृति पर प्रभाव",
          ],
        },
        {
          id: "literature-analysis",
          title: "साहित्य को ऐतिहासिक स्रोत के रूप में समझना",
          items: [
            "साहित्य से सामाजिक और आर्थिक जीवन की जानकारी",
            "साहित्यिक स्रोतों की उपयोगिता और सीमाएँ",
            "उदाहरणों के साथ आलोचनात्मक विश्लेषण",
          ],
        },
        {
          id: "literature-answer",
          title: "Mains Answer Framework",
          items: [
            "साहित्य, समाज और संस्कृति के संबंध स्थापित करना",
            "उत्तर में विशिष्ट उदाहरण जोड़ना",
            "150 और 250 शब्दों के उत्तर की रूपरेखा बनाना",
          ],
        },
      ],

      completion: {
        studyTasks: true,
        mappedPyqsAttempted: true,
        answerWritingCompleted: true,
        evaluationReviewed: true,
      },
    },

    {
      id: "buddhism-heritage",
      title: "बौद्ध कला एवं भारतीय विरासत",
      priority: "pending-analysis",

      match: {
        topics: ["Buddhism", "Misc"],
        keywords: [
          "buddhism in india",
          "buddhist ideals",
          "pala period",
          "indian art heritage",
          "safeguarding the indian art heritage",
        ],
      },

      studyTasks: [
        {
          id: "buddhist-art",
          title: "बौद्ध कला की विशेषताएँ",
          items: [
            "स्तूप और बौद्ध कला के प्रमुख तत्व",
            "बौद्ध कला में प्रतीकों और कथाओं की भूमिका",
            "बौद्ध धर्म और कला का संबंध",
          ],
        },
        {
          id: "heritage-conservation",
          title: "भारतीय कला-विरासत का संरक्षण",
          items: [
            "कला-विरासत के प्रमुख खतरे",
            "संरक्षण की चुनौतियाँ",
            "संरक्षण और जन-जागरूकता के उपाय",
          ],
        },
        {
          id: "buddhism-answer",
          title: "Mains Answer Framework",
          items: [
            "धार्मिक विचारों और कलात्मक अभिव्यक्ति को जोड़ना",
            "विरासत संरक्षण पर समस्या-समाधान ढाँचा",
            "प्रासंगिक उदाहरणों सहित उत्तर लिखना",
          ],
        },
      ],

      completion: {
        studyTasks: true,
        mappedPyqsAttempted: true,
        answerWritingCompleted: true,
        evaluationReviewed: true,
      },
    },

    {
      id: "dance-performing-arts",
      title: "नृत्य एवं प्रदर्शनकारी कलाएँ",
      priority: "pending-analysis",

      match: {
        topics: ["Dance"],
        keywords: [
          "tandava dance",
          "indian classical dance",
          "folk dance",
          "performing arts",
        ],
      },

      studyTasks: [
        {
          id: "dance-basics",
          title: "नृत्य की मूल अवधारणाएँ",
          items: [
            "शास्त्रीय और लोक नृत्य का अंतर",
            "नृत्य के प्रमुख तत्व और पारंपरिक संदर्भ",
            "नृत्य, संगीत और साहित्य का संबंध",
          ],
        },
        {
          id: "dance-examples",
          title: "क्षेत्रीय विविधताएँ",
          items: [
            "प्रमुख शास्त्रीय नृत्य और उनके क्षेत्र",
            "लोक नृत्यों की क्षेत्रीय पहचान",
            "उदाहरणों के साथ मानचित्र आधारित revision",
          ],
        },
        {
          id: "dance-answer",
          title: "Mains Answer Framework",
          items: [
            "नृत्य की ऐतिहासिक और सांस्कृतिक पृष्ठभूमि",
            "विशेषताएँ और उदाहरण",
            "उत्तर में सांस्कृतिक महत्व स्पष्ट करना",
          ],
        },
      ],

      completion: {
        studyTasks: true,
        mappedPyqsAttempted: true,
        answerWritingCompleted: true,
        evaluationReviewed: true,
      },
    },

    {
      id: "ancient-cultural-contributions",
      title: "प्राचीन भारत की कला एवं सांस्कृतिक विरासत",
      priority: "pending-analysis",

      match: {
        topics: ["Contribution", "Philosophy", "Civilisation"],
        keywords: [
          "gupta period",
          "chola period",
          "indian philosophy",
          "monuments and their art",
          "indian heritage and culture",
          "indus valley civilization",
          "vedic society and religion",
        ],
      },

      studyTasks: [
        {
          id: "ancient-culture",
          title: "प्राचीन सांस्कृतिक विकास",
          items: [
            "प्राचीन भारत की प्रमुख सांस्कृतिक विशेषताएँ",
            "गुप्तकालीन कला और सांस्कृतिक योगदान",
            "चोलकालीन कला और सांस्कृतिक योगदान",
          ],
        },
        {
          id: "philosophy-monuments",
          title: "दर्शन, धर्म और स्मारक",
          items: [
            "भारतीय दर्शन और कला के संबंध",
            "धार्मिक विचारों का स्मारकों पर प्रभाव",
            "कला और स्थापत्य से ऐतिहासिक जानकारी",
          ],
        },
        {
          id: "cultural-continuity",
          title: "सांस्कृतिक निरंतरता",
          items: [
            "प्राचीन परंपराओं की निरंतरता और परिवर्तन",
            "सभ्यता, संस्कृति और आधुनिक समाज के संबंध",
            "प्रासंगिक उदाहरणों के साथ आलोचनात्मक दृष्टिकोण",
          ],
        },
        {
          id: "ancient-answer",
          title: "Mains Answer Framework",
          items: [
            "कालखंड और योगदान के आधार पर उत्तर व्यवस्थित करना",
            "उदाहरण और तुलना का उपयोग",
            "वर्तमान संदर्भ से उचित linkage बनाना",
          ],
        },
      ],

      completion: {
        studyTasks: true,
        mappedPyqsAttempted: true,
        answerWritingCompleted: true,
        evaluationReviewed: true,
      },
    },
  ],
};
