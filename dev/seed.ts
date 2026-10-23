import type { Payload } from 'payload'

import { devUser } from './helpers/credentials.js'

/**
 * Seeds the database with initial data for development
 * Creates users, courses, lessons, topics, quizzes, and other necessary collections
 */
export const seed = async (payload: Payload) => {
  // Check if dev user exists
  const { totalDocs } = await payload.count({
    collection: 'users',
    where: {
      email: {
        equals: devUser.email,
      },
    },
  })

  if (!totalDocs) {
    // Create dev user
    const user = await payload.create({
      collection: 'users',
      data: {
        ...devUser,
        firstName: 'Dev',
        lastName: 'User',
        roles: ['admin', 'author', 'student'],
      },
    })

    // Create certificate template
    const template = await payload.create({
      collection: 'media',
      data: {
        filename: 'certificate-template.png',
        filesize: 1024,
        height: 1080,
        mimeType: 'image/png',
        width: 1920,
      },
    })

    // Create sample categories
    const programmingCategory = await payload.create({
      collection: 'categories',
      data: {
        slug: 'programming',
        title: 'Programming',
      },
    })

    const designCategory = await payload.create({
      collection: 'categories',
      data: {
        slug: 'design',
        title: 'Design',
      },
    })

    // Create sample tags
    const javascriptTag = await payload.create({
      collection: 'tags',
      data: {
        slug: 'javascript',
        title: 'JavaScript',
      },
    })

    const reactTag = await payload.create({
      collection: 'tags',
      data: {
        slug: 'react',
        title: 'React',
      },
    })

    // Create sample course
    const course = await payload.create({
      collection: 'courses',
      data: {
        accessMode: 'free',
        categories: [programmingCategory.id],
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Learn the basics of web development with HTML, CSS, and JavaScript',
                  },
                ],
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          },
        },
        excerpt: 'A comprehensive introduction to web development',
        navigationMode: 'linear',
        students: [user.id],
        tags: [javascriptTag.id, reactTag.id],
        title: 'Introduction to Web Development',
      },
    })

    // Create HTML lesson
    const htmlLesson = await payload.create({
      collection: 'lessons',
      data: {
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Learn the fundamentals of HTML',
                  },
                ],
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          },
        },
        course: course.id,
        excerpt: 'Introduction to HTML structure and elements',
        lessonOrder: 1,
        progressionControl: 'required',
        title: 'HTML Basics',
      },
    })

    // Create CSS lesson
    const cssLesson = await payload.create({
      collection: 'lessons',
      data: {
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Learn the basics of CSS styling',
                  },
                ],
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          },
        },
        course: course.id,
        excerpt: 'Introduction to CSS styling and layout',
        lessonOrder: 2,
        progressionControl: 'required',
        title: 'CSS Fundamentals',
      },
    })

    // Create HTML topics
    const htmlStructureTopic = await payload.create({
      collection: 'topics',
      data: {
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Understanding the basic structure of an HTML document',
                  },
                ],
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          },
        },
        course: course.id,
        excerpt: 'Learn about HTML document structure and essential elements',
        lesson: htmlLesson.id,
        title: 'HTML Document Structure',
        topicVideo: {
          embed: 'https://example.com/video/html-structure',
        },
      },
    })

    const htmlElementsTopic = await payload.create({
      collection: 'topics',
      data: {
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Exploring common HTML elements and their usage',
                  },
                ],
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          },
        },
        course: course.id,
        excerpt: 'Learn about different HTML elements and how to use them',
        lesson: htmlLesson.id,
        title: 'HTML Elements and Tags',
        topicVideo: {
          embed: 'https://example.com/video/html-elements',
        },
      },
    })

    const htmlFormsTopic = await payload.create({
      collection: 'topics',
      data: {
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Creating interactive forms with HTML',
                  },
                ],
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          },
        },
        course: course.id,
        excerpt: 'Learn how to create and style HTML forms',
        lesson: htmlLesson.id,
        title: 'HTML Forms and Input',
        topicVideo: {
          embed: 'https://example.com/video/html-forms',
        },
      },
    })

    // Create CSS topics
    const cssSelectorsTopic = await payload.create({
      collection: 'topics',
      data: {
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Understanding CSS selectors and common properties',
                  },
                ],
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          },
        },
        course: course.id,
        excerpt: 'Learn about CSS selectors and how to style elements',
        lesson: cssLesson.id,
        title: 'CSS Selectors and Properties',
        topicVideo: {
          embed: 'https://example.com/video/css-selectors',
        },
      },
    })

    const cssBoxModelTopic = await payload.create({
      collection: 'topics',
      data: {
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Understanding the CSS box model and layout',
                  },
                ],
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          },
        },
        course: course.id,
        excerpt: 'Learn about the CSS box model and how it affects layout',
        lesson: cssLesson.id,
        title: 'CSS Box Model',
        topicVideo: {
          embed: 'https://example.com/video/css-box-model',
        },
      },
    })

    const cssFlexboxTopic = await payload.create({
      collection: 'topics',
      data: {
        content: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Creating flexible layouts with CSS Flexbox',
                  },
                ],
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          },
        },
        course: course.id,
        excerpt: 'Learn how to create responsive layouts with Flexbox',
        lesson: cssLesson.id,
        title: 'CSS Flexbox Layout',
        topicVideo: {
          embed: 'https://example.com/video/css-flexbox',
        },
      },
    })

    // Create sample quiz
    const quiz = await payload.create({
      collection: 'quizzes',
      data: {
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Test your knowledge of HTML basics',
                  },
                ],
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          },
        },
        questions: [],
        title: 'HTML Quiz',
      },
    })

    // Create sample questions
    const question1 = await payload.create({
      collection: 'questions',
      data: {
        choices: [
          { isCorrect: true, label: 'Hyper Text Markup Language' },
          { isCorrect: false, label: 'High Tech Modern Language' },
          { isCorrect: false, label: 'Hyper Transfer Markup Language' },
        ],
        points: 10,
        question: 'What does HTML stand for?',
        questionType: 'multipleChoice',
        title: 'What does HTML stand for?',
      },
    })

    const question2 = await payload.create({
      collection: 'questions',
      data: {
        choices: [
          { isCorrect: true, label: '<h1>' },
          { isCorrect: false, label: '<h6>' },
          { isCorrect: false, label: '<head>' },
        ],
        points: 10,
        question: 'Which tag is used for the largest heading?',
        questionType: 'singleChoice',
        title: 'Which tag is used for the largest heading?',
      },
    })

    // Update quiz with questions
    await payload.update({
      id: quiz.id,
      collection: 'quizzes',
      data: {
        questions: [question1.id, question2.id],
      },
    })

    // Create sample certificate
    await payload.create({
      collection: 'certificates',
      data: {
        certificateNumber: 'WD-' + Date.now(),
        course: course.id,
        description: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    text: 'Certificate of completion for Introduction to Web Development',
                  },
                ],
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          },
        },
        issueDate: new Date().toISOString(),
        status: 'active',
        students: [user.id],
        template: template.id,
        title: 'Web Development Certificate',
      },
    })
  }
}
