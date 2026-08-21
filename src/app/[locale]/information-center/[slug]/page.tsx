import { makeArticlePage } from '../../../../components/articles/article-page';

const { generateStaticParams, generateMetadata, Page } = makeArticlePage(
  'information-center',
  'informationCenter',
);
export { generateStaticParams, generateMetadata };
export default Page;
