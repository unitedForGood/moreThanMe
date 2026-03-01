import NewsletterList from '@/components/newsletters/NewsletterList';

export const metadata = {
  title: 'Newsletters | MoreThanMe',
  description: 'Read our latest newsletters and stay updated with our work',
};

export default function NewslettersPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Our Newsletters
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Stay informed with our latest updates and stories
          </p>
        </div>

        <NewsletterList />
      </div>
    </div>
  );
}

