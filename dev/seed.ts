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
        mimeType: 'image/png',
        filesize: 1024,
        width: 1920,
        height: 1080,
      },
    })

    // Create sample categories
    const programmingCategory = await payload.create({
      collection: 'categories',
      data: {
        title: 'Programming',
        slug: 'programming',
      },
    })

    const designCategory = await payload.create({
      collection: 'categories',
      data: {
        title: 'Design',
        slug: 'design',
      },
    })

    // Create sample tags
    const javascriptTag = await payload.create({
      collection: 'tags',
      data: {
        title: 'JavaScript',
        slug: 'javascript',
      },
    })

    const reactTag = await payload.create({
      collection: 'tags',
      data: {
        title: 'React',
        slug: 'react',
      },
    })

    // Create sample course
    const course = await payload.create({
      collection: 'courses',
      data: {
        title: 'Introduction to Web Development',
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
        accessMode: 'free',
        navigationMode: 'linear',
        categories: [programmingCategory.id],
        tags: [javascriptTag.id, reactTag.id],
        students: [user.id],
      },
    })

    // Create HTML lesson
    const htmlLesson = await payload.create({
      collection: 'lessons',
      data: {
        title: 'HTML Basics',
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
        excerpt: 'Introduction to HTML structure and elements',
        course: course.id,
        progressionControl: 'required',
        lessonOrder: 1,
      },
    })

    // Create CSS lesson
    const cssLesson = await payload.create({
      collection: 'lessons',
      data: {
        title: 'CSS Fundamentals',
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
        excerpt: 'Introduction to CSS styling and layout',
        course: course.id,
        progressionControl: 'required',
        lessonOrder: 2,
      },
    })

    // Create HTML topics
    const htmlStructureTopic = await payload.create({
      collection: 'topics',
      data: {
        title: 'HTML Document Structure',
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
        excerpt: 'Learn about HTML document structure and essential elements',
        course: course.id,
        lesson: htmlLesson.id,
        topicVideo: {
          embed: 'https://example.com/video/html-structure',
        },
      },
    })

    const htmlElementsTopic = await payload.create({
      collection: 'topics',
      data: {
        title: 'HTML Elements and Tags',
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
        excerpt: 'Learn about different HTML elements and how to use them',
        course: course.id,
        lesson: htmlLesson.id,
        topicVideo: {
          embed: 'https://example.com/video/html-elements',
        },
      },
    })

    const htmlFormsTopic = await payload.create({
      collection: 'topics',
      data: {
        title: 'HTML Forms and Input',
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
        excerpt: 'Learn how to create and style HTML forms',
        course: course.id,
        lesson: htmlLesson.id,
        topicVideo: {
          embed: 'https://example.com/video/html-forms',
        },
      },
    })

    // Create CSS topics
    const cssSelectorsTopic = await payload.create({
      collection: 'topics',
      data: {
        title: 'CSS Selectors and Properties',
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
        excerpt: 'Learn about CSS selectors and how to style elements',
        course: course.id,
        lesson: cssLesson.id,
        topicVideo: {
          embed: 'https://example.com/video/css-selectors',
        },
      },
    })

    const cssBoxModelTopic = await payload.create({
      collection: 'topics',
      data: {
        title: 'CSS Box Model',
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
        excerpt: 'Learn about the CSS box model and how it affects layout',
        course: course.id,
        lesson: cssLesson.id,
        topicVideo: {
          embed: 'https://example.com/video/css-box-model',
        },
      },
    })

    const cssFlexboxTopic = await payload.create({
      collection: 'topics',
      data: {
        title: 'CSS Flexbox Layout',
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
        excerpt: 'Learn how to create responsive layouts with Flexbox',
        course: course.id,
        lesson: cssLesson.id,
        topicVideo: {
          embed: 'https://example.com/video/css-flexbox',
        },
      },
    })

    // Create sample quiz
    const quiz = await payload.create({
      collection: 'quizzes',
      data: {
        title: 'HTML Quiz',
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
      },
    })

    // Create sample questions
    const question1 = await payload.create({
      collection: 'questions',
      data: {
        title: 'What does HTML stand for?',
        points: 10,
        questionType: 'multipleChoice',
        question: 'What does HTML stand for?',
        choices: [
          { label: 'Hyper Text Markup Language', isCorrect: true },
          { label: 'High Tech Modern Language', isCorrect: false },
          { label: 'Hyper Transfer Markup Language', isCorrect: false },
        ],
      },
    })

    const question2 = await payload.create({
      collection: 'questions',
      data: {
        title: 'Which tag is used for the largest heading?',
        points: 10,
        questionType: 'singleChoice',
        question: 'Which tag is used for the largest heading?',
        choices: [
          { label: '<h1>', isCorrect: true },
          { label: '<h6>', isCorrect: false },
          { label: '<head>', isCorrect: false },
        ],
      },
    })

    // Update quiz with questions
    await payload.update({
      collection: 'quizzes',
      id: quiz.id,
      data: {
        questions: [question1.id, question2.id],
      },
    })

    // Create sample certificate
    await payload.create({
      collection: 'certificates',
      data: {
        title: 'Web Development Certificate',
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
        template: template.id,
        course: course.id,
        students: [user.id],
        issueDate: new Date().toISOString(),
        certificateNumber: 'WD-' + Date.now(),
        status: 'active',
      },
    })
  }
}
