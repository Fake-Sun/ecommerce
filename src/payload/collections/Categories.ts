import type { CollectionConfig } from 'payload/types'

import { revalidateCategory } from './Categories/hooks/revalidateCategory'
import { revalidateCategoryDelete } from './Categories/hooks/revalidateCategoryDelete'

const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
  },
  hooks: {
    afterChange: [revalidateCategory],
    afterDelete: [revalidateCategoryDelete],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}

export default Categories
