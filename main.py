import json
from parse_repo import collect_features
from parse_repo import compose_class_features
from parse_repo import compose_class_progressions
from markdown_maker import generate_descriptions


if __name__ == '__main__':
	# all features, ever
	all_features \
		= collect_features()

	# categorized class features
	class_features \
		= compose_class_features(all_features)

	# useful progression table index for classes
	class_progressions \
		= compose_class_progressions(class_features)

	generate_descriptions(all_features)
