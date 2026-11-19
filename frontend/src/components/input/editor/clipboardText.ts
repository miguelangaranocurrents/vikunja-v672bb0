import type {Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

const LIST_NAMES = ['bulletList', 'orderedList', 'taskList']

function isList(node: ProseMirrorNode): boolean {
	return LIST_NAMES.includes(node.type.name)
}

function itemMarker(list: ProseMirrorNode, item: ProseMirrorNode, ordinal: number): string {
	if (list.type.name === 'orderedList') {
		return `${ordinal}. `
	}
	if (item.type.name === 'taskItem') {
		return item.attrs.checked ? '- [x] ' : '- [ ] '
	}
	return '- '
}

function appendBlock(node: ProseMirrorNode, indent: string, lines: string[]) {
	if (!isList(node)) {
		lines.push(indent + node.textContent)
		return
	}

	let ordinal = Number(node.attrs.start ?? 1)
	node.forEach(item => {
		appendItem(item, node, ordinal, indent, lines)
		ordinal++
	})
}

function appendItem(
	item: ProseMirrorNode,
	list: ProseMirrorNode,
	ordinal: number,
	indent: string,
	lines: string[],
) {
	const marker = itemMarker(list, item, ordinal)
	const continuation = indent + ' '.repeat(marker.length)

	item.forEach((child, _offset, index) => {
		if (index === 0 && !isList(child)) {
			lines.push(indent + marker + child.textContent)
		} else if (isList(child)) {
			appendBlock(child, continuation, lines)
		} else {
			lines.push(continuation + child.textContent)
		}
	})
}

/**
 * Plain-text form of a copied selection. Lists keep their markers ("- ", "1. ",
 * "- [ ] ") so the copied text still reads as a list, and nested lists are indented.
 */
export function sliceToListAwareText(slice: Slice): string {
	const lines: string[] = []
	slice.content.forEach(node => appendBlock(node, '', lines))
	return lines.join('\n')
}
