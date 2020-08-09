from obtain_data import collect_features
from arrange_data import compose_class_features
from arrange_data import compose_class_progressions
from markdown_maker import generate_descriptions



def main():
	# Obtain all features, ever.
	all_features \
		= collect_features()

	# Categorized class features.
	class_features \
		= compose_class_features(all_features)

	# Create a useful progression table index for classes.
	class_progressions \
		= compose_class_progressions(class_features)

	# Ensure every feature has a description for every class.
	generate_descriptions(all_features)

if __name__ == '__main__':
	main()
