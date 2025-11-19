import type { Email } from '../types'
import { subHours, subDays } from 'date-fns'

export const mockEmails: Email[] = [
    {
        id: '1',
        threadId: '1',
        sender: {
            name: 'Linear',
            email: 'notifications@linear.app',
        },
        subject: 'Cycle 42 has started',
        preview:
            'The new cycle has begun. Check out the team goals and assigned tasks.',
        messages: [
            {
                id: '1',
                sender: {
                    name: 'Linear',
                    email: 'notifications@linear.app',
                },
                content: `
          <p>Hi there,</p>
          <p>Cycle 42 has officially started. Here's what's on the docket for this week:</p>
          <ul>
            <li><strong>Q3 Planning</strong> - Finalize the roadmap</li>
            <li><strong>Performance improvements</strong> - Reduce TTI by 20%</li>
            <li><strong>New onboarding flow</strong> - Design review</li>
          </ul>
          <p>Good luck!</p>
        `,
                date: subHours(new Date(), 2),
                attachments: [],
            },
        ],
        date: subHours(new Date(), 2),
        read: false,
        labels: ['work', 'updates'],
        folder: 'inbox',
    },
    {
        id: '2',
        threadId: '2',
        sender: {
            name: 'Sarah from Design',
            email: 'sarah@company.com',
        },
        subject: 'Updated mockups for the dashboard',
        preview:
            'I have attached the latest Figma links for the dashboard redesign. Let me know what you think.',
        messages: [
            {
                id: '2a',
                sender: {
                    name: 'Sarah from Design',
                    email: 'sarah@company.com',
                },
                content: `
          <p>Hey,</p>
          <p>I've updated the mockups based on yesterday's feedback. You can find them here:</p>
          <p><a href="#" class="text-[#00712D] underline">Figma Link</a></p>
          <p>Main changes:</p>
          <ul>
            <li>Simplified the navigation</li>
            <li>Updated the color palette to match the new brand guidelines</li>
          </ul>
          <p>Best,<br>Sarah</p>
        `,
                date: subHours(new Date(), 5),
                attachments: [],
            },
            {
                id: '2b',
                sender: {
                    name: 'You',
                    email: 'you@company.com',
                },
                content: `
          <p>Thanks Sarah! This looks much better.</p>
          <p>One question: did you consider moving the search bar to the top right?</p>
        `,
                date: subHours(new Date(), 4),
                attachments: [],
            },
            {
                id: '2c',
                sender: {
                    name: 'Sarah from Design',
                    email: 'sarah@company.com',
                },
                content: `
          <p>Good point! I'll try that out and send an update shortly.</p>
        `,
                date: subHours(new Date(), 3),
                attachments: [],
            },
        ],
        date: subHours(new Date(), 3),
        read: true,
        labels: ['design', 'work'],
        folder: 'inbox',
    },
    {
        id: '3',
        threadId: '3',
        sender: {
            name: 'Newsletter Weekly',
            email: 'weekly@newsletter.com',
        },
        subject: 'The future of React Server Components',
        preview:
            'This week we dive deep into RSC and what it means for the ecosystem.',
        messages: [
            {
                id: '3',
                sender: {
                    name: 'Newsletter Weekly',
                    email: 'weekly@newsletter.com',
                },
                content: `
          <p>Welcome back to Newsletter Weekly!</p>
          <p>This week is all about <strong>React Server Components</strong>.</p>
          <p>Are they the future? Or just another hype train? We break it down.</p>
        `,
                date: subDays(new Date(), 1),
                attachments: [],
            },
        ],
        date: subDays(new Date(), 1),
        read: true,
        labels: ['newsletter'],
        folder: 'inbox',
    },
    {
        id: '4',
        threadId: '4',
        sender: {
            name: 'GitHub',
            email: 'noreply@github.com',
        },
        subject: 'Security alert for your repository',
        preview:
            'We found a potential security vulnerability in one of your dependencies.',
        messages: [
            {
                id: '4',
                sender: {
                    name: 'GitHub',
                    email: 'noreply@github.com',
                },
                content: `
          <p>We found a potential security vulnerability in one of your dependencies.</p>
          <p>Please review the alert and update the package as soon as possible.</p>
        `,
                date: subDays(new Date(), 2),
                attachments: [],
            },
        ],
        date: subDays(new Date(), 2),
        read: false,
        labels: ['github', 'alert'],
        folder: 'inbox',
    },
]
